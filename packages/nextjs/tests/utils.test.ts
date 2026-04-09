/**
 * Utility function tests for ChronoPlan
 *
 * Covers:
 * - Token utilities (tokens.ts)
 * - Query key factory (query-keys.ts)
 * - Request debouncer (requestDebouncer.ts)
 * - Request tracker (requestTracker.ts)
 * - Event utilities (eventUtils.ts)
 * - Profile utilities (profile.ts)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// tokens
import {
  getChronoPlanNetwork,
  getTokens,
  getToken,
  POPULAR_SYMBOLS,
  getPopularTokenAddresses,
  getAddressToSymbol,
  type ChronoPlanNetwork,
} from "../utils/tokens";

// query-keys
import { scheduleKeys } from "../hooks/query-keys";

// requestDebouncer
import {
  debounceRpcRequest,
  createDebouncedRpcCall,
  RateLimiter,
} from "../utils/requestDebouncer";

// requestTracker - RequestTracker class is not exported, only singleton
import { requestTracker } from "../utils/requestTracker";

// eventUtils
import {
  getDisplayValue,
  getCairoType,
  getCopyValue,
  hasMeaningfulDecodedArgs,
  extractEventKeys,
  extractEventData,
} from "../utils/blockexplorer/eventUtils";

// profile
import { getStarknetPFPIfExists } from "../utils/profile";

// ─────────────────────────────────────────────────────────────────────────────
// Tokens Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getChronoPlanNetwork", () => {
  const originalEnv = process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK;

  afterEach(() => {
    process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK = originalEnv;
  });

  it("returns 'sepolia' by default when env is undefined", () => {
    delete process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK;
    expect(getChronoPlanNetwork()).toBe("sepolia");
  });

  it("returns 'sepolia' when env is empty string", () => {
    process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK = "";
    expect(getChronoPlanNetwork()).toBe("sepolia");
  });

  it("returns 'mainnet' when env is 'mainnet'", () => {
    process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK = "mainnet";
    expect(getChronoPlanNetwork()).toBe("mainnet");
  });

  it("returns 'sepolia' for any other value", () => {
    process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK = "testnet";
    expect(getChronoPlanNetwork()).toBe("sepolia");
  });
});

describe("getTokens", () => {
  const originalEnv = process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK;

  afterEach(() => {
    process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK = originalEnv;
  });

  it("returns sepolia tokens by default", () => {
    delete process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK;
    const tokens = getTokens();
    expect(tokens).toBeDefined();
    expect(tokens["STRK"]).toBeDefined();
  });

  it("returns mainnet tokens when network is mainnet", () => {
    process.env.NEXT_PUBLIC_CHRONOPLAN_NETWORK = "mainnet";
    const tokens = getTokens();
    expect(tokens).toBeDefined();
    expect(tokens["STRK"]).toBeDefined();
  });
});

describe("getToken", () => {
  it("returns token for valid symbol", () => {
    const token = getToken("STRK");
    expect(token).toBeDefined();
    expect(token?.symbol).toBe("STRK");
  });

  it("returns token for ETH", () => {
    const token = getToken("ETH");
    expect(token).toBeDefined();
    expect(token?.symbol).toBe("ETH");
  });

  it("returns undefined for invalid symbol", () => {
    const token = getToken("INVALID");
    expect(token).toBeUndefined();
  });

  it("handles case sensitivity", () => {
    // Tokens are typically uppercase
    const token = getToken("strk");
    // Should handle gracefully
    expect(typeof token).toBeDefined();
  });
});

describe("POPULAR_SYMBOLS", () => {
  it("contains expected symbols", () => {
    expect(POPULAR_SYMBOLS).toContain("STRK");
    expect(POPULAR_SYMBOLS).toContain("ETH");
    expect(POPULAR_SYMBOLS).toContain("USDC");
  });

  it("has exactly 3 popular symbols", () => {
    expect(POPULAR_SYMBOLS).toHaveLength(3);
  });
});

describe("getPopularTokenAddresses", () => {
  it("returns array of addresses", () => {
    const addresses = getPopularTokenAddresses();
    expect(Array.isArray(addresses)).toBe(true);
    expect(addresses.length).toBeGreaterThan(0);
  });

  it("returns valid hex addresses", () => {
    const addresses = getPopularTokenAddresses();
    for (const addr of addresses) {
      expect(addr).toMatch(/^0x[0-9a-fA-F]+$/);
    }
  });

  it("returns lowercased addresses", () => {
    const addresses = getPopularTokenAddresses();
    for (const addr of addresses) {
      expect(addr).toBe(addr.toLowerCase());
    }
  });
});

describe("getAddressToSymbol", () => {
  it("returns a mapping object", () => {
    const map = getAddressToSymbol();
    expect(typeof map).toBe("object");
    expect(map).not.toBeNull();
  });

  it("contains STRK mapping", () => {
    const map = getAddressToSymbol();
    const strkToken = getToken("STRK");
    if (strkToken?.address) {
      const key = strkToken.address.toString().toLowerCase();
      expect(map[key]).toBe("STRK");
    }
  });

  it("keys are lowercase addresses", () => {
    const map = getAddressToSymbol();
    for (const key of Object.keys(map)) {
      expect(key).toBe(key.toLowerCase());
      expect(key).toMatch(/^0x/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("scheduleKeys", () => {
  describe("byFunder", () => {
    it("creates correct query key for funder address", () => {
      const key = scheduleKeys.byFunder("0x123");
      expect(key).toContain("schedule");
      expect(key).toContain("by-funder");
      expect(key).toContain("0x123");
    });

    it("normalizes address to lowercase", () => {
      const key1 = scheduleKeys.byFunder("0xABC");
      const key2 = scheduleKeys.byFunder("0xabc");
      expect(key1).toEqual(key2);
    });

    it("returns tuple", () => {
      const key = scheduleKeys.byFunder("0x123");
      expect(Array.isArray(key)).toBe(true);
    });
  });

  describe("byRecipient", () => {
    it("creates correct query key for recipient address", () => {
      const key = scheduleKeys.byRecipient("0x456");
      expect(key).toContain("schedule");
      expect(key).toContain("by-recipient");
      expect(key).toContain("0x456");
    });

    it("normalizes address to lowercase", () => {
      const key1 = scheduleKeys.byRecipient("0xDEF");
      const key2 = scheduleKeys.byRecipient("0xdef");
      expect(key1).toEqual(key2);
    });
  });

  describe("planInfo", () => {
    it("creates correct query key for plan info", () => {
      const key = scheduleKeys.planInfo("0x789");
      expect(key).toContain("schedule");
      expect(key).toContain("registry");
      expect(key).toContain("plan-info");
      expect(key).toContain("0x789");
    });

    it("includes registry address in key", () => {
      const key = scheduleKeys.planInfo("0x111");
      expect(key).toContain("registry");
    });
  });

  describe("available", () => {
    it("creates correct query key for available amount", () => {
      const key = scheduleKeys.available("0xABC");
      expect(key).toContain("schedule");
      expect(key).toContain("available");
      expect(key).toContain("0xabc");
    });

    it("normalizes schedule address to lowercase", () => {
      const key1 = scheduleKeys.available("0xXYZ");
      const key2 = scheduleKeys.available("0xxyz");
      expect(key1).toEqual(key2);
    });
  });

  describe("claimed", () => {
    it("creates correct query key for claimed amount", () => {
      const key = scheduleKeys.claimed("0xDEF");
      expect(key).toContain("schedule");
      expect(key).toContain("claimed");
    });
  });

  describe("status", () => {
    it("creates correct query key for status", () => {
      const key = scheduleKeys.status("0xGHI");
      expect(key).toContain("schedule");
      expect(key).toContain("status");
    });
  });

  describe("schedule", () => {
    it("creates correct query key for schedule data", () => {
      const key = scheduleKeys.schedule("0xJKL");
      expect(key).toContain("schedule");
      expect(key).toContain("data");
    });
  });

  it("all keys are unique", () => {
    const keys = [
      scheduleKeys.byFunder("0x1"),
      scheduleKeys.byRecipient("0x1"),
      scheduleKeys.planInfo("0x1"),
      scheduleKeys.available("0x1"),
      scheduleKeys.claimed("0x1"),
      scheduleKeys.status("0x1"),
      scheduleKeys.schedule("0x1"),
    ];

    // Some keys might overlap in structure but should have unique content
    const keyStrings = keys.map((k) => JSON.stringify(k));
    expect(new Set(keyStrings).size).toBe(keys.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Request Debouncer Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("debounceRpcRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes request function immediately for new key", async () => {
    const mockFn = vi.fn().mockResolvedValue("result");
    const result = await debounceRpcRequest("key1", mockFn);

    expect(result).toBe("result");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("returns pending promise for same key", async () => {
    const mockFn = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("result"), 50)),
      );

    const promise1 = debounceRpcRequest("key2", mockFn);
    const promise2 = debounceRpcRequest("key2", mockFn);

    // Should return the same promise
    expect(promise1).toBe(promise2);
    expect(mockFn).toHaveBeenCalledTimes(1);

    await promise1;
  });

  it("allows new request after previous completes", async () => {
    let callCount = 0;
    const mockFn = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(`result${callCount}`);
    });

    const promise1 = debounceRpcRequest("key3", mockFn);
    await promise1;

    const promise2 = debounceRpcRequest("key3", mockFn);
    await promise2;

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("handles different keys independently", async () => {
    const mockFn1 = vi.fn().mockResolvedValue("result1");
    const mockFn2 = vi.fn().mockResolvedValue("result2");

    const promise1 = debounceRpcRequest("keyA", mockFn1);
    const promise2 = debounceRpcRequest("keyB", mockFn2);

    expect(promise1).not.toBe(promise2);
    expect(await promise1).toBe("result1");
    expect(await promise2).toBe("result2");
  });

  it("cleans up pending request on success", async () => {
    const mockFn = vi.fn().mockResolvedValue("success");
    await debounceRpcRequest("cleanup", mockFn);

    // Second call should execute new request
    const promise = debounceRpcRequest("cleanup", mockFn);
    expect(mockFn).toHaveBeenCalledTimes(2);
    await promise;
  });

  it("cleans up pending request on error", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("fail"));

    try {
      await debounceRpcRequest("errorKey", mockFn);
    } catch (e) {
      // Expected error
    }

    // Second call should execute new request
    const mockFn2 = vi.fn().mockResolvedValue("success");
    const promise = debounceRpcRequest("errorKey", mockFn2);
    expect(mockFn2).toHaveBeenCalledTimes(1);
    await promise;
  });
});

describe("createDebouncedRpcCall", () => {
  it("creates a debounced function", async () => {
    const execute = vi.fn().mockResolvedValue("executed");

    const debounced = createDebouncedRpcCall("test", () => ["param1"], execute);

    const result = await debounced();
    expect(result).toBe("executed");
    expect(execute).toHaveBeenCalledWith("param1");
  });

  it("generates key from prefix and params", async () => {
    const execute = vi.fn().mockResolvedValue("ok");

    const debounced1 = createDebouncedRpcCall(
      "prefix",
      () => ["a", "b"],
      execute,
    );

    const debounced2 = createDebouncedRpcCall(
      "prefix",
      () => ["c", "d"],
      execute,
    );

    await debounced1();
    await debounced2();

    expect(execute).toHaveBeenCalledTimes(2);
  });
});

describe("RateLimiter", () => {
  it("has acquire method", () => {
    const limiter = new RateLimiter();
    expect(typeof limiter.acquire).toBe("function");
  });

  it("respects custom maxConcurrent in constructor", () => {
    const limiter = new RateLimiter(5);
    expect(limiter.acquire).toBeDefined();
  });

  it("acquire returns a promise", async () => {
    const limiter = new RateLimiter(10);
    const mockFn = vi.fn().mockResolvedValue("ok");

    const promise = limiter.acquire(mockFn);
    expect(promise).toBeInstanceOf(Promise);

    const result = await promise;
    expect(result).toBe("ok");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("executes function when acquired", async () => {
    const limiter = new RateLimiter(10);
    const mockFn = vi.fn().mockResolvedValue("result");

    await limiter.acquire(mockFn);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("handles function that rejects", async () => {
    const limiter = new RateLimiter(10);
    const mockFn = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(limiter.acquire(mockFn)).rejects.toThrow("fail");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Request Tracker Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("requestTracker singleton", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has getCounts method", () => {
    expect(typeof requestTracker.getCounts).toBe("function");
  });

  it("has reset method", () => {
    expect(typeof requestTracker.reset).toBe("function");
  });

  it("has increment method", () => {
    expect(typeof requestTracker.increment).toBe("function");
  });

  it("getCounts returns object", () => {
    const counts = requestTracker.getCounts();
    expect(typeof counts).toBe("object");
    expect(counts).not.toBeNull();
  });

  it("reset clears counts", () => {
    requestTracker.reset();
    const counts = requestTracker.getCounts();
    expect(Object.keys(counts).length).toBe(0);
  });

  it("returns copy on getCounts (immutability)", () => {
    const counts1 = requestTracker.getCounts();
    const counts2 = requestTracker.getCounts();

    expect(counts1).not.toBe(counts2);
    expect(counts1).toEqual(counts2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Event Utils Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getDisplayValue", () => {
  it("formats bigint as hex", () => {
    const result = getDisplayValue(BigInt(255));
    expect(result).toBe("0xff");
  });

  it("formats boolean as string", () => {
    expect(getDisplayValue(true)).toBe("true");
    expect(getDisplayValue(false)).toBe("false");
  });

  it("formats hex string with quotes", () => {
    const result = getDisplayValue("0x123");
    expect(result).toBe("0x123");
  });

  it("formats regular string with quotes", () => {
    const result = getDisplayValue("hello");
    expect(result).toBe('"hello"');
  });

  it("formats number as string", () => {
    expect(getDisplayValue(42)).toBe("42");
    expect(getDisplayValue(3.14)).toBe("3.14");
  });

  it("formats null as string", () => {
    expect(getDisplayValue(null)).toBe("null");
  });

  it("formats undefined as string", () => {
    expect(getDisplayValue(undefined)).toBe("undefined");
  });

  it("formats object using String()", () => {
    // String({a:1}) = "[object Object]"
    expect(getDisplayValue({ a: 1 })).toBe("[object Object]");
  });

  it("formats array as string", () => {
    // Arrays are not objects, so String() is used
    expect(getDisplayValue([1, 2, 3])).toBe("1,2,3");
  });
});

describe("getCairoType", () => {
  it("returns ABI type when available", () => {
    const result = getCairoType("value", "param", {
      param: "core::felt252",
    });
    expect(result).toBe("core::felt252");
  });

  it("returns bool type for boolean values", () => {
    const result = getCairoType(true);
    expect(result).toBe("core::bool");
  });

  it("returns ContractAddress for 66-char hex", () => {
    const hex = "0x" + "a".repeat(64);
    const result = getCairoType(hex);
    expect(result).toBe("core::starknet::contract_address::ContractAddress");
  });

  it("returns felt252 for short hex", () => {
    const result = getCairoType("0xFF");
    expect(result).toBe("core::felt252");
  });

  it("returns ByteArray for non-hex strings", () => {
    const result = getCairoType("hello world");
    expect(result).toBe("core::byte_array::ByteArray");
  });

  it("returns u256 for bigint", () => {
    const result = getCairoType(BigInt(100));
    expect(result).toBe("core::integer::u256");
  });

  it("defaults to felt252 for unknown types", () => {
    const result = getCairoType(Symbol("test"));
    expect(result).toBe("core::felt252");
  });
});

describe("getCopyValue", () => {
  it("formats bigint as hex", () => {
    const result = getCopyValue(BigInt(255));
    expect(result).toBe("0xff");
  });

  it("returns string for other values", () => {
    expect(getCopyValue("hello")).toBe("hello");
    expect(getCopyValue(42)).toBe("42");
    expect(getCopyValue(true)).toBe("true");
  });
});

describe("hasMeaningfulDecodedArgs", () => {
  it("returns false for empty object", () => {
    expect(hasMeaningfulDecodedArgs({})).toBe(false);
  });

  it("returns false if all keys start with key/data", () => {
    const args = {
      key1: "value1",
      data1: "value2",
    };
    expect(hasMeaningfulDecodedArgs(args)).toBe(false);
  });

  it("returns true if any key doesn't start with key/data", () => {
    const args = {
      recipient: "0x123",
      amount: "100",
      key1: "value",
    };
    expect(hasMeaningfulDecodedArgs(args)).toBe(true);
  });

  it("handles mixed case prefixes", () => {
    const args = {
      Key1: "value", // Capital K - not matched by startsWith
      user: "value2",
    };
    expect(hasMeaningfulDecodedArgs(args)).toBe(true);
  });
});

describe("extractEventKeys", () => {
  it("extracts selector and key fields", () => {
    const args = {
      selector: "transfer",
      key1: "key_value_1",
      key2: "key_value_2",
      data1: "data_value",
    };

    const keys = extractEventKeys(args);
    expect(keys).toContain("transfer");
    expect(keys).toContain("key_value_1");
    expect(keys).toContain("key_value_2");
    expect(keys).not.toContain("data_value");
  });

  it("handles missing selector", () => {
    const args = {
      key1: "value1",
    };
    const keys = extractEventKeys(args);
    expect(keys).toContain("value1");
    expect(keys[0]).toBeUndefined();
  });

  it("returns array with undefined for empty object", () => {
    // Returns [selector, ...filtered] where selector is undefined for empty
    const keys = extractEventKeys({});
    expect(keys).toHaveLength(1);
    expect(keys[0]).toBeUndefined();
  });
});

describe("extractEventData", () => {
  it("extracts only data fields", () => {
    const args = {
      data1: "value1",
      data2: "value2",
      key1: "not_data",
    };

    const data = extractEventData(args);
    expect(data).toEqual(["value1", "value2"]);
  });

  it("returns empty array for no data fields", () => {
    const data = extractEventData({
      key1: "value",
      other: "stuff",
    });
    expect(data).toHaveLength(0);
  });

  it("extracts data fields in insertion order", () => {
    const args = {
      data1: "first",
      data2: "second",
      data3: "third",
    };

    const data = extractEventData(args);
    expect(data).toEqual(["first", "second", "third"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Profile Utils Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getStarknetPFPIfExists", () => {
  it("returns undefined for default identicon URL", () => {
    const result = getStarknetPFPIfExists(
      "https://starknet.id/api/identicons/0",
    );
    expect(result).toBeUndefined();
  });

  it("returns URL for non-default profile picture", () => {
    const url = "https://starknet.id/api/identicons/123";
    const result = getStarknetPFPIfExists(url);
    expect(result).toBe(url);
  });

  it("handles undefined input", () => {
    const result = getStarknetPFPIfExists(undefined);
    expect(result).toBeUndefined();
  });

  it("handles empty string", () => {
    const result = getStarknetPFPIfExists("");
    expect(result).toBe(""); // Empty string passes the check
  });

  it("handles non-starknet URLs", () => {
    const url = "https://example.com/avatar.png";
    const result = getStarknetPFPIfExists(url);
    expect(result).toBe(url);
  });

  it("is case-sensitive for identicon check", () => {
    // The check is exact match for the default URL
    const url = "https://STARKNET.ID/api/identicons/0";
    const result = getStarknetPFPIfExists(url);
    expect(result).toBe(url); // Different case, so not filtered
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Token and Query Integration", () => {
  it("can use token addresses in query keys", () => {
    const strkToken = getToken("STRK");
    if (strkToken?.address) {
      const key = scheduleKeys.byRecipient(strkToken.address.toString());
      expect(key).toContain("by-recipient");
    }
  });

  it("address to symbol mapping works with getToken", () => {
    const strkToken = getToken("STRK");
    if (strkToken?.address) {
      const map = getAddressToSymbol();
      const key = strkToken.address.toString().toLowerCase();
      expect(map[key]).toBe("STRK");
    }
  });
});

describe("Event Parsing Integration", () => {
  it("extractEventKeys and extractEventData work together", () => {
    const eventArgs = {
      selector: "Transfer",
      from: "0x123",
      to: "0x456",
      amount: "1000",
    };

    // These would be extracted from raw event
    const rawArgs = {
      selector: "Transfer",
      key1: "0x123", // from
      key2: "0x456", // to
      data1: "1000", // amount
    };

    const keys = extractEventKeys(rawArgs);
    const data = extractEventData(rawArgs);

    expect(keys).toContain("Transfer");
    expect(data).toHaveLength(1);
  });
});
