export const memoryCache = new Map<string, { value: string; expires: number }>();

export const cache = {
  get: async (key: string) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },
  setex: async (key: string, seconds: number, value: string) => {
    memoryCache.set(key, {
      value,
      expires: Date.now() + seconds * 1000,
    });
    return "OK";
  },
  del: async (key: string) => {
    return memoryCache.delete(key) ? 1 : 0;
  },
  ping: async () => "PONG",
  quit: async () => "OK",
};
