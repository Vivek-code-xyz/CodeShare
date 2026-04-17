/**
 * server/src/store.js
 * Persistent store backed by Upstash Redis in production,
 * falls back to in-memory Maps for local development.
 */

const USE_REDIS = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// ─── Redis-backed store (production) ─────────────────────────────────────────
let redis;
if (USE_REDIS) {
  const { Redis } = await import('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('[Store] Using Upstash Redis for persistent storage.');
} else {
  console.log('[Store] Using in-memory Maps (dev mode). Data will not persist across restarts.');
}

// Helper: remaining TTL in seconds for a key
const getRemainingTtl = async (key) => {
  const ttl = await redis.ttl(key);
  return ttl > 0 ? ttl : 300; // default 5 min if no TTL found
};

// ─── fileStore ────────────────────────────────────────────────────────────────
const _fileMap = new Map();

export const fileStore = USE_REDIS
  ? {
      async get(id) {
        const data = await redis.get(`file:${id}`);
        return data || null;
      },
      async set(id, session, ttlMs) {
        const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
        await redis.set(`file:${id}`, session, { ex: ttlSec });
      },
      async update(id, session) {
        const ttl = await getRemainingTtl(`file:${id}`);
        await redis.set(`file:${id}`, session, { ex: ttl });
      },
      async delete(id) {
        await redis.del(`file:${id}`);
      },
    }
  : {
      get: (id) => Promise.resolve(_fileMap.get(id) ?? null),
      set: (id, session) => Promise.resolve(_fileMap.set(id, session)),
      update: (id, session) => Promise.resolve(_fileMap.set(id, session)),
      delete: (id) => Promise.resolve(_fileMap.delete(id)),
    };

// ─── messageStore ─────────────────────────────────────────────────────────────
const _msgMap = new Map();

export const messageStore = USE_REDIS
  ? {
      async get(id) {
        const data = await redis.get(`msg:${id}`);
        return data || null;
      },
      async set(id, session, ttlMs) {
        const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
        await redis.set(`msg:${id}`, session, { ex: ttlSec });
      },
      async delete(id) {
        await redis.del(`msg:${id}`);
      },
    }
  : {
      get: (id) => Promise.resolve(_msgMap.get(id) ?? null),
      set: (id, session) => Promise.resolve(_msgMap.set(id, session)),
      delete: (id) => Promise.resolve(_msgMap.delete(id)),
    };
