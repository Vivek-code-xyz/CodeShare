/**
 * server/src/index.js
 * Main entry point for EphemeralDrop Backend.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { startCleanupJob } from './utils/cleanup.js';
import fileRoutes from './routes/file.js';
import messageRoutes from './routes/message.js';
import { fileStore, messageStore } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
    origin: true, // Allow any dynamic origin (e.g. LAN IPs like 192.168.x.x)
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
}));
app.use(express.json());

// Chrome DevTools well-known endpoint (silences CSP warning)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(200).json({});
});

// Routes
app.use('/api/file', fileRoutes);
app.use('/api/message', messageRoutes);

// Dev-only flush route — safely flushes in-memory store only
if (!isProd) {
    app.delete('/api/admin/flush', (req, res) => {
        console.log('[Admin] Flushing all in-memory sessions...');
        fileStore.clear();
        messageStore.clear();
        res.json({ message: 'All in-memory data flushed' });
    });
}

// In production: serve the built Vite frontend from ../Client/dist
// This makes a single-server deployment (e.g., Railway) possible.
if (isProd) {
    const distPath = path.join(__dirname, '../../Client/dist');
    app.use(express.static(distPath));
    // SPA fallback: send index.html for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Start cleanup job
startCleanupJob();

app.listen(PORT, () => {
    console.log(`🚀 EphemeralDrop Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${isProd ? 'production' : 'development'}`);
    console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '⚠️  NOT CONFIGURED'}`);
    console.log(`⏱️  Expiry: Files (${process.env.SESSION_TTL_FILE_MIN}m), Messages (${process.env.SESSION_TTL_MESSAGE_MIN}m)`);
});
