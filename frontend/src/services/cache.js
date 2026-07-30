/**
 * Tiny request cache.
 *
 * Every page previously refetched on mount, so navigating Dashboard -> Jobs ->
 * Dashboard re-ran the same queries from scratch. This keeps results for a
 * short TTL and de-duplicates concurrent calls for the same key.
 *
 * Deliberately ~60 lines rather than a data-fetching library: the app has a
 * handful of endpoints and no need for a dependency.
 */

const store = new Map();
const inFlight = new Map();

const DEFAULT_TTL = 60_000; // 1 minute

/**
 * Run `loader` unless a fresh cached value exists.
 *
 * @param {string} key    cache key; include params that change the result
 * @param {Function} loader  async function producing the value
 * @param {Object} options   { ttl, force }
 */
export async function cached(key, loader, { ttl = DEFAULT_TTL, force = false } = {}) {
  if (!force) {
    const hit = store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value;
    }

    // Someone else is already loading this exact key - share their promise
    // instead of firing a second identical request.
    const pending = inFlight.get(key);
    if (pending) return pending;
  }

  const promise = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expiresAt: Date.now() + ttl });
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/** Drop cache entries whose key starts with `prefix`. Call after mutations. */
export function invalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Write a value straight into the cache (e.g. after an update response). */
export function primeCache(key, value, ttl = DEFAULT_TTL) {
  store.set(key, { value, expiresAt: Date.now() + ttl });
}

/** Clear everything. Used on sign-out so the next user starts clean. */
export function clearCache() {
  store.clear();
  inFlight.clear();
}
