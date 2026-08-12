/**
 * Tiny request cache with Stale-While-Revalidate (SWR) support.
 *
 * Serves cached results instantly upon navigation while updating in the background.
 * Keeps results for sensible TTLs and de-duplicates concurrent calls for the same key.
 */

const store = new Map();
const inFlight = new Map();

const DEFAULT_TTL = 120_000; // 2 minutes

/**
 * Return current cached value synchronously if present (stale or fresh).
 */
export function getCachedValue(key) {
  const hit = store.get(key);
  return hit ? hit.value : undefined;
}

/**
 * Run `loader` unless a fresh cached value exists.
 * When `swr: true` and a stale cached value exists, returns stale value immediately
 * and revalidates in the background.
 *
 * @param {string} key    cache key; include params that change the result
 * @param {Function} loader  async function producing the value
 * @param {Object} options   { ttl, force, swr }
 */
export async function cached(key, loader, { ttl = DEFAULT_TTL, force = false, swr = true } = {}) {
  const hit = store.get(key);
  const isFresh = hit && hit.expiresAt > Date.now();

  if (hit && isFresh && !force) {
    return hit.value;
  }

  // De-duplicate in-flight requests for the exact same key
  const pending = inFlight.get(key);
  if (pending && !force) {
    if (hit && swr) return hit.value;
    return pending;
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

  // Stale-While-Revalidate: return stale hit immediately if available
  if (hit && swr && !force) {
    return hit.value;
  }

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

