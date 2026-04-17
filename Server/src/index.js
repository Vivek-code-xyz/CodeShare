/**
 * server/src/index.js
 * Main entry point for EphemeralDrop Backend.
 * Deployed on Render as a persistent Node.js service.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { startCleanupJob } from './utils/cleanup.js';
import fileRoutes from './routes/file.js';
import messageRoutes from './routes/message.js';
import { fileStore, messageStore } from './store.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — allow the Vercel frontend origin
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
}));
app.use(express.json());

// Health check (Render uses this to verify the service is alive)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/file', fileRoutes);
app.use('/api/message', messageRoutes);

// Dev-only flush route
if (process.env.NODE_ENV !== 'production') {
    app.delete('/api/admin/flush', (req, res) => {
        console.log('[Admin] Flushing all in-memory sessions...');
        fileStore.clear();
        messageStore.clear();
        res.json({ message: 'All in-memory data flushed' });
    });
}

// Start cleanup job (works because Render is a persistent process)
startCleanupJob();

app.listen(PORT, () => {
    console.log(`🚀 EphemeralDrop Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '⚠️  NOT CONFIGURED'}`);
    console.log(`⏱️  Expiry: Files (${process.env.SESSION_TTL_FILE_MIN || 7}m), Messages (${process.env.SESSION_TTL_MESSAGE_MIN || 5}m)`);
});
