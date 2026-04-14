/**
 * server/src/utils/cleanup.js
 * Utility to periodically purge expired sessions and delete associated Cloudinary files.
 */
import { fileStore, messageStore } from '../store.js';
import { deleteFromCloudinary } from './cloudinary.js';

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
    if (session.files && session.files.length > 0) {
        for (const file of session.files) {
            if (file.publicId) {
                await deleteFromCloudinary(file.publicId, file.resourceType || 'raw');
            }
        }
    }
    fileStore.delete(id);
};
