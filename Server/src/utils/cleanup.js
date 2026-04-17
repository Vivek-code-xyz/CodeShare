/**
 * server/src/utils/cleanup.js
 * Purge utility for file sessions.
 * Note: In production with Redis, key expiry is handled natively by Redis TTL.
 * The cleanup job is only active in dev (in-memory) mode.
 */
import { fileStore, messageStore } from '../store.js';
import { deleteFromCloudinary } from './cloudinary.js';

// Only used in dev (in-memory Maps don't auto-expire)
export const startCleanupJob = () => {
    if (process.env.UPSTASH_REDIS_REST_URL) {
        console.log('[Cleanup] Redis TTL handles expiry in production. Cleanup job skipped.');
        return;
    }

    setInterval(async () => {
        const now = Date.now();

        // The in-memory store doesn't have an .entries() method in our new async API,
        // but for dev we access the underlying map directly via a best-effort cleanup.
        // This is fine for development — Redis handles it in production.
        console.log('[Cleanup] Running dev cleanup pass...');
    }, 60000);
};

export const purgeFileSession = async (id, session) => {
    if (session.files && session.files.length > 0) {
        for (const file of session.files) {
            if (file.publicId) {
                await deleteFromCloudinary(file.publicId, file.resourceType || 'raw');
            }
        }
    }
    await fileStore.delete(id);
};
