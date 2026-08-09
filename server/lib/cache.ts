import Redis from "ioredis";
import { serverLogger } from "../logger";

export const memoryCache = new Map<string, { value: string; expires: number }>();

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export const getRedisClient = (): Redis | null => {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (redisUrl || redisHost) {
    try {
      if (redisUrl) {
        redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
        });
      } else {
        redisClient = new Redis({
          host: redisHost,
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
        });
      }

      redisClient.on("connect", () => {
        isRedisAvailable = true;
        serverLogger.info("[REDIS] Connected to Redis server successfully");
      });

      redisClient.on("error", (err: any) => {
        isRedisAvailable = false;
        serverLogger.warn("[REDIS] Client error occurrence", { error: err.message });
      });
    } catch (err: any) {
      serverLogger.warn("[REDIS] Failed to initialize Redis client, falling back to Memory cache", { error: err.message });
      redisClient = null;
    }
  } else {
    serverLogger.info("[REDIS] No configuration variables found. Operating in localized in-memory cache mode.");
  }

  return redisClient;
};

// Initialize client immediately
getRedisClient();

export const cache = {
  get: async (key: string): Promise<string | null> => {
    const client = getRedisClient();
    if (client && isRedisAvailable) {
      try {
        return await client.get(key);
      } catch (err: any) {
        serverLogger.error("[REDIS] Get operation failed", { key, error: err.message });
      }
    }

    // In-memory fallback
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },

  setex: async (key: string, seconds: number, value: string): Promise<string> => {
    const client = getRedisClient();
    if (client && isRedisAvailable) {
      try {
        await client.setex(key, seconds, value);
        return "OK";
      } catch (err: any) {
        serverLogger.error("[REDIS] Setex operation failed", { key, error: err.message });
      }
    }

    // In-memory fallback
    memoryCache.set(key, {
      value,
      expires: Date.now() + seconds * 1000,
    });
    return "OK";
  },

  del: async (key: string): Promise<number> => {
    const client = getRedisClient();
    if (client && isRedisAvailable) {
      try {
        return await client.del(key);
      } catch (err: any) {
        serverLogger.error("[REDIS] Del operation failed", { key, error: err.message });
      }
    }

    // In-memory fallback
    return memoryCache.delete(key) ? 1 : 0;
  },

  delPattern: async (pattern: string): Promise<number> => {
    const client = getRedisClient();
    if (client && isRedisAvailable) {
      try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          return await client.del(...keys);
        }
        return 0;
      } catch (err: any) {
        serverLogger.error("[REDIS] DelPattern operation failed", { pattern, error: err.message });
      }
    }

    // In-memory fallback
    let deletedCount = 0;
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        if (memoryCache.delete(key)) {
          deletedCount++;
        }
      }
    }
    return deletedCount;
  },

  ping: async (): Promise<string> => {
    const client = getRedisClient();
    if (client && isRedisAvailable) {
      try {
        return await client.ping();
      } catch (err) {
        // Fallback
      }
    }
    return "PONG";
  },

  quit: async (): Promise<string> => {
    const client = getRedisClient();
    if (client) {
      try {
        await client.quit();
      } catch (err) {
        // Ignore
      }
    }
    return "OK";
  }
};

