/**
 * server/src/utils/cleanup.js
 * Periodically purge expired sessions and delete associated Cloudinary files.
 */
import { fileCodeStore, fileStore, messageStore } from '../store.js';
import { deleteFromCloudinary } from './cloudinary.js';
import { promises as fs } from 'fs';

export const startCleanupJob = () => {
    setInterval(async () => {
        const now = Date.now();

        // Cleanup expired file sessions
        for (const [id, session] of fileStore.entries()) {
            if (now > session.expiresAt) {
                console.log(`[Cleanup] File session ${id} expired. Purging from Cloudinary...`);
                await purgeFileSession(id, session);
            }
        }

        // Cleanup expired message sessions
        for (const [id, session] of messageStore.entries()) {
            if (now > session.expiresAt) {
                console.log(`[Cleanup] Message session ${id} expired. Purging...`);
                messageStore.delete(id);
            }
        }
    }, 60000); // Run every 60s
};

export const purgeFileSession = async (id, session) => {
    if (session?.code) {
        fileCodeStore.delete(session.code);
    }

    if (session.files && session.files.length > 0) {
        for (const file of session.files) {
            if (file.localPath) {
                try {
                    await fs.unlink(file.localPath);
                } catch (err) {
                    if (err.code !== 'ENOENT') {
                        console.error(`[Cleanup] Error deleting local file ${file.localPath}:`, err.message);
                    }
                }
            }

            if (file.publicId) {
                await deleteFromCloudinary(file.publicId, file.resourceType || 'raw');
            }
        }
    }
    fileStore.delete(id);
};
