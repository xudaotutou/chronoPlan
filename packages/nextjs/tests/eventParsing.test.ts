/**
 * Event parsing tests for ScheduleDeployed events
 */

import { describe, it, expect } from "vitest";

// Mock ScheduleDeployed event data structure:
// data[0] = plan_id (key), data[1] = schedule_address (key)
// data[2] = recipient, data[3] = governance, data[4] = funder
// data[5] = amount_low, data[6] = amount_high

interface MockEvent {
  data?: string[];
  keys?: string[][];
}

interface ParsedSchedule {
  address: string;
  recipient: string;
  amount: string;
  claimed: string;
  status: string;
}

function parseScheduleDeployedEvent(
  ev: MockEvent,
  address: string,
): ParsedSchedule | null {
  // Validate event has expected data length
  if (!ev.data || ev.data.length < 7) {
    return null;
  }

  const scheduleAddress = ev.data[1];
  const recipient = ev.data[2];
  const funder = ev.data[4];

  // Filter by address match (recipient or funder)
  const addrLower = address.toLowerCase();
  const recipientMatch = recipient?.toLowerCase() === addrLower;
  const funderMatch = funder?.toLowerCase() === addrLower;

  if (scheduleAddress && (recipientMatch || funderMatch)) {
    // Parse u256 amount safely
    let amount = "0";
    try {
      const amountLow = ev.data[5] ? BigInt(ev.data[5]) : 0n;
      const amountHigh = ev.data[6] ? BigInt(ev.data[6]) : 0n;
      amount = ((amountHigh << 128n) + amountLow).toString();
    } catch {
      // Failed to parse amount
      return null;
    }

    return {
      address: scheduleAddress,
      recipient: recipient || "0",
      amount,
      claimed: "0",
      status: "active",
    };
  }

  return null;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("parseScheduleDeployedEvent", () => {
  const userAddress =
    "0x0214a754822faecf57b898d2e69f396e629a2cce5e2f51075e62269042b558da".toLowerCase();
  const otherAddress = "0x034aA3F359A9D614239015126635CE7732c18fDF3";

  it("parses valid event where user is recipient", () => {
    const event: MockEvent = {
      keys: [["0x123"], ["0x456"]],
      data: [
        "0x1", // plan_id
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567", // schedule_address
        userAddress, // recipient (matches user)
        "0x0000000000000000000000000000000000000000000000000000000000000000", // governance
        otherAddress, // funder
        "0x10f401f4fd2c1428", // amount_low
        "0x0", // amount_high
      ],
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).not.toBeNull();
    expect(result!.address).toBe(
      "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
    );
    expect(result!.recipient).toBe(userAddress);
    expect(result!.status).toBe("active");
  });

  it("parses valid event where user is funder", () => {
    const event: MockEvent = {
      keys: [["0x123"], ["0x456"]],
      data: [
        "0x1", // plan_id
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567", // schedule_address
        otherAddress, // recipient
        "0x0000000000000000000000000000000000000000000000000000000000000000", // governance
        userAddress, // funder (matches user)
        "0x10f401f4fd2c1428", // amount_low
        "0x0", // amount_high
      ],
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).not.toBeNull();
    expect(result!.address).toBe(
      "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
    );
  });

  it("returns null when user is neither recipient nor funder", () => {
    const event: MockEvent = {
      keys: [["0x123"], ["0x456"]],
      data: [
        "0x1",
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
        otherAddress, // recipient (not user)
        "0x0",
        otherAddress, // funder (not user)
        "0x10f401f4fd2c1428",
        "0x0",
      ],
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).toBeNull();
  });

  it("returns null for event with insufficient data", () => {
    const event: MockEvent = {
      data: ["0x1", "0x2", "0x3"], // Only 3 elements
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).toBeNull();
  });

  it("returns null for empty data", () => {
    const event: MockEvent = {};

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).toBeNull();
  });

  it("handles case-insensitive address matching", () => {
    const event: MockEvent = {
      data: [
        "0x1",
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
        userAddress.toUpperCase(), // Uppercase version
        "0x0",
        otherAddress,
        "0x10f401f4fd2c1428",
        "0x0",
      ],
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).not.toBeNull();
  });

  it("correctly parses u256 amount (23 STRK)", () => {
    // 23 * 10^18 = 23000000000000000000
    const amountLow = "23000000000000000000";
    const event: MockEvent = {
      data: [
        "0x1",
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
        userAddress,
        "0x0",
        otherAddress,
        amountLow, // amount_low
        "0x0", // amount_high
      ],
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe("23000000000000000000");
  });

  it("correctly parses large u256 amount (high > 0)", () => {
    // amount = 1 << 200 = very large number
    const amountLow = "0";
    const amountHigh = "0x1000000000000000000000000"; // 2^100 in hex

    const event: MockEvent = {
      data: [
        "0x1",
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
        userAddress,
        "0x0",
        otherAddress,
        amountLow,
        amountHigh,
      ],
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).not.toBeNull();

    // Verify the reconstructed amount
    const expectedAmount = (BigInt(amountHigh) << 128n) + BigInt(amountLow);
    expect(result!.amount).toBe(expectedAmount.toString());
  });

  it("handles zero amount gracefully", () => {
    const event: MockEvent = {
      data: [
        "0x1",
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
        userAddress,
        "0x0",
        otherAddress,
        "0",
        "0",
      ],
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).not.toBeNull();
    expect(result!.amount).toBe("0");
  });

  it("returns null when amount parsing fails", () => {
    const event: MockEvent = {
      data: [
        "0x1",
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
        userAddress,
        "0x0",
        otherAddress,
        "invalid", // Invalid amount
        "0x0",
      ],
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).toBeNull();
  });
});

describe("parseScheduleDeployedEvent edge cases", () => {
  const userAddress =
    "0x0214a754822faecf57b898d2e69f396e629a2cce5e2f51075e62269042b558da";

  it("handles undefined data gracefully", () => {
    const event: MockEvent = {
      data: undefined,
    };

    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).toBeNull();
  });

  it("handles null values in data array", () => {
    const event: MockEvent = {
      data: [
        "0x1",
        "0x789abcdef123456789abcdef123456789abcdef123456789abcdef1234567",
        null as any, // null recipient
        "0x0",
        userAddress,
        "0x0",
        "0x0",
      ],
    };

    // Should still work, treating null as "0"
    const result = parseScheduleDeployedEvent(event, userAddress);
    expect(result).not.toBeNull();
    expect(result!.recipient).toBe("0");
  });
});
