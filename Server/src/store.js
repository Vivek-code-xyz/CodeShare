/**
 * server/src/store.js
 * In-memory data store for sessions.
 * Works perfectly on Render (persistent Node.js process).
 */

export const fileStore = new Map();
export const messageStore = new Map();

/**
 * FileSession shape:
 * { id, files: [{publicId, secureUrl, resourceType, originalName, size, mimeType, downloaded}],
 *   createdAt, expiresAt }
 * 
 * MessageSession shape:
 * { id, content, createdAt, expiresAt, viewed, destroyOnRead: bool }
 */
