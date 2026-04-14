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
import { uploadToCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// Frontend origin for share URLs
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

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
        const expiresAt = Date.now() + (parseInt(process.env.SESSION_TTL_FILE_MIN) || 7) * 60000;

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

        fileStore.set(sessionId, session);
        console.log(`[Upload] Session ${sessionId} created — ${uploadedFiles.length} file(s) on Cloudinary`);

        res.json({
            id: sessionId,
            shareUrl: `${CLIENT_ORIGIN}/file/${sessionId}`,
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
        // Fetch the file from Cloudinary server-side
        const cloudRes = await fetch(file.secureUrl);
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

        // Convert Web ReadableStream → Node Readable, then pipe to client
        Readable.fromWeb(cloudRes.body).pipe(res);

        // Mark downloaded after headers are sent
        session.files[idx].downloaded = true;

        // Schedule purge if all files claimed
        const allDownloaded = session.files.every(f => f.downloaded);
        if (allDownloaded) {
            console.log(`[Store] All files claimed for session ${id}. Purging in 15s...`);
            setTimeout(async () => {
                await purgeFileSession(id, session);
            }, 15000);
        }
    } catch (err) {
        console.error('[Download] Proxy error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    }
});

// GET /api/file/:id  — session metadata (after /download to avoid collision)
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
