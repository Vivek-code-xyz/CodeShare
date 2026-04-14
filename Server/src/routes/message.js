/**
 * server/src/routes/message.js
 * API routes for secret messages.
 */
import express from 'express';
import { nanoid } from 'nanoid';
import { messageStore } from '../store.js';

const router = express.Router();

// Frontend origin for share URLs
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// POST /api/message
router.post('/', (req, res) => {
    const { content, destroyOnRead } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
    }

    if (content.length > 5000) {
        return res.status(400).json({ error: 'Message too long (max 5000 chars)' });
    }

    const sessionId = nanoid(12);
    const expiresAt = Date.now() + (parseInt(process.env.SESSION_TTL_MESSAGE_MIN) || 5) * 60000;

    const session = {
        id: sessionId,
        content,
        createdAt: Date.now(),
        expiresAt,
        viewed: false,
        destroyOnRead: destroyOnRead === true
    };

    messageStore.set(sessionId, session);

    res.json({
        id: sessionId,
        shareUrl: `${CLIENT_ORIGIN}/message/${sessionId}`,
        expiresAt
    });
});

// GET /api/message/:id
router.get('/:id', (req, res) => {
    const session = messageStore.get(req.params.id);

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
router.delete('/:id', (req, res) => {
    const session = messageStore.get(req.params.id);

    if (!session) {
        return res.status(404).json({ error: 'Message not found or already destroyed' });
    }

    messageStore.delete(req.params.id);
    console.log(`[Store] Message ${req.params.id} confirmed read and destroyed.`);
    res.json({ message: 'Secret destroyed successfully' });
});

export default router;
