/**
 * server/src/index.js
 * Main entry point for EphemeralDrop Backend.
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

// Dev-only flush route
if (process.env.NODE_ENV === 'development') {
    app.delete('/api/admin/flush', async (req, res) => {
        console.log('[Admin] Flushing all sessions and files...');
        
        // Delete all files
        const files = await fs.readdir(uploadDir);
        for (const file of files) {
            await fs.remove(`${uploadDir}/${file}`);
        }
        
        fileStore.clear();
        messageStore.clear();
        res.json({ message: 'All data flushed' });
    });
}

// Start cleanup job
startCleanupJob();

app.listen(PORT, () => {
    console.log(`🚀 EphemeralDrop Server running on http://localhost:${PORT}`);
    console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || '⚠️  NOT CONFIGURED'}`);
    console.log(`⏱️  Expiry: Files (${process.env.SESSION_TTL_FILE_MIN}m), Messages (${process.env.SESSION_TTL_MESSAGE_MIN}m)`);
});
