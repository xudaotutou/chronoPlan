import { BlockIdentifier, ProviderInterface } from "starknet";

// Minimum time between RPC calls for the same address (debounce)
// Increased to 5 seconds to reduce rate limiting
const DEBOUNCE_MS = 5000;

export class ContractClassHashCache {
  private static instance: ContractClassHashCache;
  private cache = new Map<string, string>();
  private pendingRequests = new Map<string, Promise<string | undefined>>();
  // Track last fetch timestamp for debouncing
  private lastFetchTime = new Map<string, number>();

  private constructor() {}

  public static getInstance(): ContractClassHashCache {
    if (!ContractClassHashCache.instance) {
      ContractClassHashCache.instance = new ContractClassHashCache();
    }
    return ContractClassHashCache.instance;
  }

  public async getClassHash(
    publicClient: ProviderInterface,
    address: string,
    blockIdentifier: BlockIdentifier = "latest",
  ): Promise<string | undefined> {
    const cacheKey = `${address}-${blockIdentifier}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return Promise.resolve(this.cache.get(cacheKey));
    }

    // Debounce: skip if we fetched recently
    const now = Date.now();
    const lastFetch = this.lastFetchTime.get(cacheKey) || 0;
    if (now - lastFetch < DEBOUNCE_MS) {
      return Promise.resolve(undefined);
    }

    // Deduplicate pending requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const pendingRequest = this.fetchClassHash(
      publicClient,
      address,
      blockIdentifier,
      cacheKey,
    );
    this.pendingRequests.set(cacheKey, pendingRequest);

    try {
      return await pendingRequest;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async fetchClassHash(
    publicClient: ProviderInterface,
    address: string,
    blockIdentifier: BlockIdentifier,
    cacheKey: string,
  ): Promise<string | undefined> {
    try {
      this.lastFetchTime.set(cacheKey, Date.now());
      const classHash = await publicClient.getClassHashAt(
        address,
        blockIdentifier,
      );
      this.cache.set(cacheKey, classHash);
      return classHash;
    } catch (error) {
      // Don't log 429 errors to console - they indicate rate limiting which is expected
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("429")) {
        console.error("Failed to fetch class hash:", error);
      }
      return undefined;
    }
  }

  public clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.lastFetchTime.clear();
  }
}
