/**
 * Request debouncer for RPC calls
 * Prevents rapid-fire requests that could overwhelm the RPC provider
 */

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Debounce RPC requests by key
 * If the same key is requested while a previous request is pending,
 * return the pending promise instead of making a new request
 */
export function debounceRpcRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
): Promise<T> {
  // If there's already a pending request for this key, return it
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // Make the request and store the promise
  const promise = requestFn().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Create a debounced RPC call with automatic key generation
 */
export function createDebouncedRpcCall<T>(
  prefix: string,
  getParams: () => string[],
  execute: (...params: string[]) => Promise<T>,
): () => Promise<T> {
  return () => {
    const params = getParams();
    const key = `${prefix}:${params.join(",")}`;
    return debounceRpcRequest(key, () => execute(...params));
  };
}

/**
 * Rate limiter for RPC calls
 * Ensures no more than maxConcurrent requests are in flight at once
 */
export class RateLimiter {
  private inFlight = 0;

  constructor(private maxConcurrent: number = 10) {}

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if too many requests are in flight
    while (this.inFlight >= this.maxConcurrent) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.inFlight++;
    try {
      return await fn();
    } finally {
      this.inFlight--;
    }
  }
}

export const globalRateLimiter = new RateLimiter(10);
