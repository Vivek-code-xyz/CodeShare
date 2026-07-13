/**
 * server/src/routes/file.js
 * API routes for file uploads backed by Cloudinary.
 */
import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import { fileCodeStore, fileStore } from '../store.js';
import { purgeFileSession } from '../utils/cleanup.js';
import { uploadToCloudinary, buildCloudinaryDeliveryUrl } from '../utils/cloudinary.js';

const router = express.Router();

// Multer: memory storage, no local disk writes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 60) * 1024 * 1024 }
});

const generateReceiveCode = () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        if (!fileCodeStore.has(code)) return code;
    }

    throw new Error('Unable to generate a unique receive code');
};

const getActiveSession = (id) => {
    const session = fileStore.get(id);
    if (!session || Date.now() > session.expiresAt) return null;
    return session;
};

// POST /api/file/upload
router.post('/upload', upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const sessionId = nanoid(10);
        const code = generateReceiveCode();
        const expiresAt = Date.now() + (parseInt(process.env.SESSION_TTL_FILE_MIN) || 7) * 60000;

        // Upload all files to Cloudinary in parallel
        const uploadedFiles = await Promise.all(
            req.files.map(async (f) => {
                const { publicId, secureUrl, resourceType, format } = await uploadToCloudinary(
                    f.buffer,
                    f.originalname,
                    f.mimetype
                );
                return {
                    publicId,
                    secureUrl,
                    resourceType,
                    format,
                    originalName: f.originalname,
                    size: f.size,
                    mimeType: f.mimetype,
                    downloaded: false,
                };
            })
        );

        const session = {
            id: sessionId,
            code,
            files: uploadedFiles,
            createdAt: Date.now(),
            expiresAt,
        };

        fileStore.set(sessionId, session);
        fileCodeStore.set(code, sessionId);
        console.log(`[Upload] Session ${sessionId} created with receive code ${code} - ${uploadedFiles.length} file(s) on Cloudinary`);

        // Determine the frontend origin dynamically
        const origin = process.env.CLIENT_ORIGIN || `${req.protocol}://${req.get('host')}`.replace(`:${process.env.PORT || 5000}`, ':5173');

        res.json({
            id: sessionId,
            code,
            shareUrl: `${origin}/file/${sessionId}`,
            codeUrl: `${origin}/file/code/${code}`,
            expiresAt,
        });
    } catch (err) {
        console.error('[Upload] Error:', err);
        res.status(500).json({ error: 'Failed to upload files. Please try again.' });
    }
});

// GET /api/file/code/:code - resolve a six-digit receive code to session metadata
router.get('/code/:code', (req, res) => {
    const { code } = req.params;

    if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ error: 'Enter a valid 6-digit code' });
    }

    const sessionId = fileCodeStore.get(code);
    const session = sessionId ? getActiveSession(sessionId) : null;

    if (!session) {
        if (sessionId) fileCodeStore.delete(code);
        return res.status(404).json({ error: 'Code not found or expired' });
    }

    res.json({
        id: session.id,
        code: session.code,
        files: session.files.map(f => ({
            originalName: f.originalName,
            size: f.size,
            mimeType: f.mimeType,
            downloaded: f.downloaded,
        })),
        expiresAt: session.expiresAt,
    });
});

// GET /api/file/download/:id/:fileIndex - proxy stream (Cloudinary URL never exposed)
router.get('/download/:id/:fileIndex', async (req, res) => {
    const { id, fileIndex } = req.params;
    const session = fileStore.get(id);

    if (!session || Date.now() > session.expiresAt) {
        return res.status(404).json({ error: 'Session not found or expired' });
    }

    const idx = parseInt(fileIndex);
    const file = session.files[idx];
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        const cloudinaryUrls = [
            file.secureUrl,
            buildCloudinaryDeliveryUrl(file.publicId, file.resourceType, file.originalName, file.format),
        ].filter((url, index, urls) => url && urls.indexOf(url) === index);

        const failedAttempts = [];
        let cloudRes = null;

        for (const url of cloudinaryUrls) {
            const attemptRes = await fetch(url);
            if (attemptRes.ok) {
                cloudRes = attemptRes;
                break;
            }

            let body = '';
            try {
                body = (await attemptRes.text()).replace(/\s+/g, ' ').trim().slice(0, 500);
            } catch {
                body = 'Unable to read Cloudinary error response body';
            }

            failedAttempts.push({
                status: attemptRes.status,
                statusText: attemptRes.statusText,
                url,
                body,
            });
        }

        if (!cloudRes) {
            const lastFailure = failedAttempts.at(-1);
            console.error('[Download] Cloudinary retrieval failed:', {
                sessionId: id,
                fileIndex: idx,
                publicId: file.publicId,
                resourceType: file.resourceType,
                mimeType: file.mimeType,
                attempts: failedAttempts,
            });

            const providerMessage = lastFailure
                ? `Cloudinary returned ${lastFailure.status} ${lastFailure.statusText}${lastFailure.body ? `: ${lastFailure.body}` : ''}`
                : 'No Cloudinary delivery URL was available';

            return res.status(502).json({
                error: `Failed to retrieve file from storage. ${providerMessage}`,
                provider: 'cloudinary',
                status: lastFailure?.status,
            });
        }

        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(file.originalName)}"`
        );
        if (cloudRes.headers.get('content-length')) {
            res.setHeader('Content-Length', cloudRes.headers.get('content-length'));
        }

        if (cloudRes.body) {
            Readable.fromWeb(cloudRes.body).pipe(res);
        } else {
            const fileBuffer = Buffer.from(await cloudRes.arrayBuffer());
            res.end(fileBuffer);
        }

        // Mark downloaded
        session.files[idx].downloaded = true;

        // Check if all files are now claimed
        const allDownloaded = session.files.every(f => f.downloaded);
        if (allDownloaded) {
            console.log(`[Store] All files claimed for session ${id}. Purging immediately...`);
            session.expiresAt = 0;
            await purgeFileSession(id, session);
        }
    } catch (err) {
        console.error('[Download] Proxy error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    }
});

// GET /api/file/:id - session metadata
router.get('/:id', (req, res) => {
    const session = fileStore.get(req.params.id);

    if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
    }

    if (Date.now() > session.expiresAt) {
        return res.status(404).json({ error: 'Session has expired' });
    }

    res.json({
        id: session.id,
        code: session.code,
        files: session.files.map(f => ({
            originalName: f.originalName,
            size: f.size,
            mimeType: f.mimeType,
            downloaded: f.downloaded,
        })),
        expiresAt: session.expiresAt,
    });
});

export default router;
