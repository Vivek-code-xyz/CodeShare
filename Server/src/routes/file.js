/**
 * server/src/routes/file.js
 * API routes for file uploads — backed by Cloudinary.
 */
import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
import { fileStore } from '../store.js';
import { purgeFileSession } from '../utils/cleanup.js';
import { uploadToCloudinary, buildCloudinaryDeliveryUrl } from '../utils/cloudinary.js';

const router = express.Router();

// Multer: memory storage — no local disk writes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 60) * 1024 * 1024 }
});

// POST /api/file/upload
router.post('/upload', upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const sessionId = nanoid(10);
        const ttlMs = (parseInt(process.env.SESSION_TTL_FILE_MIN) || 7) * 60000;
        const expiresAt = Date.now() + ttlMs;

        // Upload all files to Cloudinary in parallel
        const uploadedFiles = await Promise.all(
            req.files.map(async (f) => {
                const { publicId, secureUrl, resourceType } = await uploadToCloudinary(
                    f.buffer,
                    f.originalname,
                    f.mimetype
                );
                return {
                    publicId,
                    secureUrl,
                    resourceType,
                    originalName: f.originalname,
                    size: f.size,
                    mimeType: f.mimetype,
                    downloaded: false,
                };
            })
        );

        const session = {
            id: sessionId,
            files: uploadedFiles,
            createdAt: Date.now(),
            expiresAt,
        };

        await fileStore.set(sessionId, session, ttlMs);
        console.log(`[Upload] Session ${sessionId} created — ${uploadedFiles.length} file(s) on Cloudinary`);

        // Determine the frontend origin dynamically if not set
        const origin = process.env.CLIENT_ORIGIN || `${req.protocol}://${req.get('host')}`.replace(':5000', ':5173');

        res.json({
            id: sessionId,
            shareUrl: `${origin}/file/${sessionId}`,
            expiresAt,
        });
    } catch (err) {
        console.error('[Upload] Error:', err);
        res.status(500).json({ error: 'Failed to upload files. Please try again.' });
    }
});

// GET /api/file/download/:id/:fileIndex  — proxy stream (Cloudinary URL never exposed)
// MUST be before /:id to avoid route capture
router.get('/download/:id/:fileIndex', async (req, res) => {
    const { id, fileIndex } = req.params;
    const session = await fileStore.get(id);

    if (!session || Date.now() > session.expiresAt) {
        return res.status(404).json({ error: 'Session not found or expired' });
    }

    const idx = parseInt(fileIndex);
    const file = session.files[idx];
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        const preferredUrl = buildCloudinaryDeliveryUrl(file.publicId, file.resourceType, file.originalName);
        const fallbackUrl = file.secureUrl;

        // Fetch from Cloudinary server-side with a fallback URL strategy.
        let cloudRes = await fetch(preferredUrl);
        if (!cloudRes.ok && fallbackUrl && fallbackUrl !== preferredUrl) {
            cloudRes = await fetch(fallbackUrl);
        }

        if (!cloudRes.ok) {
            return res.status(502).json({ error: 'Failed to retrieve file from storage' });
        }

        // Set headers so browser saves it with the original filename
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(file.originalName)}"`
        );
        if (cloudRes.headers.get('content-length')) {
            res.setHeader('Content-Length', cloudRes.headers.get('content-length'));
        }

        // Convert Web ReadableStream -> Node Readable, then pipe to client.
        if (cloudRes.body) {
            Readable.fromWeb(cloudRes.body).pipe(res);
        } else {
            const fileBuffer = Buffer.from(await cloudRes.arrayBuffer());
            res.end(fileBuffer);
        }

        // Mark downloaded and persist updated session
        session.files[idx].downloaded = true;

        // Check if all files are now claimed
        const allDownloaded = session.files.every(f => f.downloaded);
        if (allDownloaded) {
            console.log(`[Store] All files claimed for session ${id}. Purging immediately...`);
            session.expiresAt = 0;
            await fileStore.update(id, session);
            await purgeFileSession(id, session);
        } else {
            await fileStore.update(id, session);
        }
    } catch (err) {
        console.error('[Download] Proxy error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    }
});

// GET /api/file/:id  — session metadata (after /download to avoid collision)
router.get('/:id', async (req, res) => {
    const session = await fileStore.get(req.params.id);

    if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
    }

    if (Date.now() > session.expiresAt) {
        return res.status(404).json({ error: 'Session has expired' });
    }

    res.json({
        id: session.id,
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
