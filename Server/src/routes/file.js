/**
 * server/src/routes/file.js
 * API routes for file uploads backed by Cloudinary.
 */
import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import path from 'path';
import { promises as fs } from 'fs';
import { fileCodeStore, fileStore } from '../store.js';
import { purgeFileSession } from '../utils/cleanup.js';
import { uploadToCloudinary, buildCloudinaryDeliveryUrl } from '../utils/cloudinary.js';

const router = express.Router();

// Multer: memory storage, no local disk writes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 60) * 1024 * 1024 }
});

const localUploadDir = path.resolve(process.cwd(), 'uploads');

const ensureUploadDir = async () => {
    await fs.mkdir(localUploadDir, { recursive: true });
};

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const getLocalFilePath = (sessionId, fileIndex, originalName) => {
    const safeName = sanitizeFileName(originalName);
    return path.join(localUploadDir, `${sessionId}-${fileIndex}-${safeName}`);
};

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
        await ensureUploadDir();

        // Upload all files to Cloudinary in parallel
        const uploadedFiles = await Promise.all(
            req.files.map(async (f, index) => {
                const isPdf = f.mimetype === 'application/pdf';
                const localPath = isPdf ? getLocalFilePath(sessionId, index, f.originalname) : null;

                if (localPath) {
                    await fs.writeFile(localPath, f.buffer);
                    return {
                        publicId: null,
                        secureUrl: null,
                        resourceType: 'raw',
                        format: 'pdf',
                        originalName: f.originalname,
                        size: f.size,
                        mimeType: f.mimetype,
                        downloaded: false,
                        localPath,
                    };
                }

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
                    localPath: null,
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
        if (file.mimeType === 'application/pdf' && file.localPath) {
            res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${encodeURIComponent(file.originalName)}"`
            );

            const fileBuffer = await fs.readFile(file.localPath);
            res.setHeader('Content-Length', fileBuffer.length);
            res.end(fileBuffer);

            session.files[idx].downloaded = true;

            const allDownloaded = session.files.every(f => f.downloaded);
            if (allDownloaded) {
                console.log(`[Store] All files claimed for session ${id}. Purging immediately...`);
                session.expiresAt = 0;
                await purgeFileSession(id, session);
            }

            return;
        }

        const preferredUrl = buildCloudinaryDeliveryUrl(
            file.publicId,
            file.resourceType,
            file.originalName,
            file.format
        );
        const fallbackUrl = file.secureUrl;

        let cloudRes = await fetch(preferredUrl);
        if (!cloudRes.ok && fallbackUrl && fallbackUrl !== preferredUrl) {
            cloudRes = await fetch(fallbackUrl);
        }

        if (!cloudRes.ok) {
            return res.status(502).json({ error: 'Failed to retrieve file from storage' });
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
