type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

// Global singleton cache across warm serverless/Node invocations
const globalForCache = globalThis as unknown as {
  __hct_cache__?: Map<string, CacheEntry<unknown>>;
};

const cacheStore = globalForCache.__hct_cache__ ?? new Map<string, CacheEntry<unknown>>();
globalForCache.__hct_cache__ = cacheStore;

const DEFAULT_TTL_MS = 60_000; // 60 seconds

export function getCached<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateProjectCache(projectId?: string): void {
  if (!projectId) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(projectId)) {
      cacheStore.delete(key);
    }
  }
}

export function invalidateUserCache(userId: string): void {
  for (const key of cacheStore.keys()) {
    if (key.includes(userId)) {
      cacheStore.delete(key);
    }
  }
}
