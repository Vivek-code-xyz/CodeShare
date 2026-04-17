/**
 * server/src/routes/message.js
 * API routes for secret messages.
 */
import express from 'express';
import { nanoid } from 'nanoid';
import { messageStore } from '../store.js';

const router = express.Router();

// POST /api/message
router.post('/', async (req, res) => {
    const { content, destroyOnRead } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.length > 5000) {
        return res.status(400).json({ error: 'Message too long (max 5000 chars)' });
    }

    const sessionId = nanoid(12);
    const ttlMs = (parseInt(process.env.SESSION_TTL_MESSAGE_MIN) || 5) * 60000;
    const expiresAt = Date.now() + ttlMs;

    const session = {
        id: sessionId,
        content,
        createdAt: Date.now(),
        expiresAt,
        viewed: false,
        destroyOnRead: destroyOnRead === true
    };

    await messageStore.set(sessionId, session, ttlMs);

    // Determine the frontend origin dynamically if not set
    const origin = process.env.CLIENT_ORIGIN || `${req.protocol}://${req.get('host')}`.replace(':5000', ':5173');

    res.json({
        id: sessionId,
        shareUrl: `${origin}/message/${sessionId}`,
        expiresAt
    });
});

// GET /api/message/:id
router.get('/:id', async (req, res) => {
    const session = await messageStore.get(req.params.id);

    // Redis auto-deletes expired keys, so null = expired or never existed
    if (!session || Date.now() > session.expiresAt) {
        return res.status(404).json({ error: 'Message not found or expired' });
    }

    res.json({
        content: session.content,
        expiresAt: session.expiresAt,
        destroyOnRead: session.destroyOnRead
    });
});

// DELETE /api/message/:id — called when user confirms they've read the message
router.delete('/:id', async (req, res) => {
    const session = await messageStore.get(req.params.id);

    if (!session) {
        return res.status(404).json({ error: 'Message not found or already destroyed' });
    }

    await messageStore.delete(req.params.id);
    console.log(`[Store] Message ${req.params.id} confirmed read and destroyed.`);
    res.json({ message: 'Secret destroyed successfully' });
});

export default router;
