import type { RedisClientType } from 'redis';

type CacheBackend = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
};

class InMemoryCache implements CacheBackend {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }
}

class RedisCache implements CacheBackend {
  constructor(private client: RedisClientType) {}

  async get(key: string): Promise<string | null> {
    return (await this.client.get(key)) as string | null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }
}

let backend: CacheBackend | null = null;

export function initCache(redisClient?: RedisClientType) {
  if (redisClient) {
    backend = new RedisCache(redisClient);
  } else {
    backend = new InMemoryCache();
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!backend) initCache();
  return backend!.get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (!backend) initCache();
  return backend!.set(key, value, ttlSeconds);
}
