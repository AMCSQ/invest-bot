import { LRUCache } from "lru-cache";

// In-memory idempotency cache. Single-instance only — for multi-instance
// deployments swap this to Redis (the surface area is intentionally small:
// `wasProcessed(key)` + `markProcessed(key, ttlSec)`).
//
// TODO: swap for Redis when scaling beyond one Node process. Suggested impl:
//   import { Redis } from "@upstash/redis";
//   const r = Redis.fromEnv();
//   wasProcessed = (k) => r.exists(`tv:${k}`).then(Boolean)
//   markProcessed = (k, ttl) => r.set(`tv:${k}`, "1", { ex: ttl })

const cache = new LRUCache<string, true>({
  max: 5_000,
  // Default TTL = 1h; per-call override allowed.
  ttl: 60 * 60 * 1000,
});

export function wasProcessed(key: string): boolean {
  return cache.has(key);
}

export function markProcessed(key: string, ttlSeconds = 3_600): void {
  cache.set(key, true, { ttl: ttlSeconds * 1000 });
}
