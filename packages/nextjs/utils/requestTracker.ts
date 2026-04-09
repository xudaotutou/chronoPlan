/**
 * Request tracker for debugging API calls
 * Helps identify when and why requests are being made
 */

class RequestTracker {
  private counts: Record<string, number> = {};
  private enabled =
    typeof window !== "undefined" && process.env.NODE_ENV === "development";

  increment(url: string) {
    if (!this.enabled) return;

    const cleanUrl = url.split("?")[0]; // Remove query params for grouping
    this.counts[cleanUrl] = (this.counts[cleanUrl] || 0) + 1;

    const total = Object.values(this.counts).reduce((a, b) => a + b, 0);

    // Only log every 10 requests to avoid console spam
    if (total % 10 === 0) {
      console.log(`[RequestTracker] Total: ${total}`, this.counts);
    }

    // Alert if too many requests
    if (total > 100 && total % 50 === 0) {
      console.warn(
        `[RequestTracker] WARNING: ${total} requests made!`,
        this.counts,
      );
    }
  }

  reset() {
    this.counts = {};
    console.log("[RequestTracker] Reset");
  }

  getCounts() {
    return { ...this.counts };
  }
}

export const requestTracker = new RequestTracker();

// Hook to monitor fetch calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = args[0]?.toString() || "";

  // Track relevant API calls
  if (
    url.includes("coingecko") ||
    url.includes("/api/price") ||
    url.includes("rpc")
  ) {
    requestTracker.increment(url);
  }

  return originalFetch.apply(window, args);
};
