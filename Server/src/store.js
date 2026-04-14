/**
 * server/src/store.js
 * In-memory data store for sessions.
 */

export const fileStore = new Map();
export const messageStore = new Map();

/**
 * FileSession shape:
 * { id, files: [{path, originalName, size, mimeType}],
 *   createdAt, expiresAt, downloadCount, maxDownloads: 2 }
 * 
 * MessageSession shape:
 * { id, content, createdAt, expiresAt, viewed, destroyOnRead: bool }
 */
