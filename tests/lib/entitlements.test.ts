import { describe, it, expect } from "vitest";
import { monthKey, dayKey } from "@/lib/entitlements.server";

// ---------------------------------------------------------------------------
// monthKey — returns YYYY-MM UTC key for a given date (pure)
// ---------------------------------------------------------------------------

describe("monthKey", () => {
  it("returns correct YYYY-MM for January", () => {
    expect(monthKey(new Date("2025-01-15"))).toBe("2025-01");
  });

  it("returns correct YYYY-MM for December", () => {
    expect(monthKey(new Date("2025-12-25"))).toBe("2025-12");
  });

  it("zero-pads single-digit months (e.g. March -> 03)", () => {
    expect(monthKey(new Date("2025-03-01"))).toBe("2025-03");
  });

  it("handles years with century rollover", () => {
    expect(monthKey(new Date("1999-12-31"))).toBe("1999-12");
    expect(monthKey(new Date("2000-01-01"))).toBe("2000-01");
  });

  it("uses UTC month boundary — late Dec 31 in UTC may be Jan elsewhere", () => {
    // December 31 2025 23:00 UTC → still December
    expect(monthKey(new Date("2025-12-31T23:00:00Z"))).toBe("2025-12");
    // January 1 2026 00:00 UTC → January
    expect(monthKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01");
  });

  it("default parameter returns current UTC month", () => {
    const result = monthKey();
    // Should match the current UTC year-month pattern
    expect(result).toMatch(/^\d{4}-\d{2}$/);
    const [year, month] = result.split("-").map(Number);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
    expect(year).toBeGreaterThanOrEqual(2024);
  });
});

// ---------------------------------------------------------------------------
// dayKey — returns YYYY-MM-DD UTC key for a given date (pure)
// ---------------------------------------------------------------------------

describe("dayKey", () => {
  it("returns correct YYYY-MM-DD for a mid-month date", () => {
    expect(dayKey(new Date("2025-06-15T12:00:00Z"))).toBe("2025-06-15");
  });

  it("zero-pads single-digit month and day", () => {
    expect(dayKey(new Date("2025-01-05T00:00:00Z"))).toBe("2025-01-05");
  });

  it("handles December 31st", () => {
    expect(dayKey(new Date("2025-12-31T23:59:59Z"))).toBe("2025-12-31");
  });

  it("handles leap year day (Feb 29)", () => {
    expect(dayKey(new Date("2024-02-29T12:00:00Z"))).toBe("2024-02-29");
  });

  it("default parameter returns current UTC date", () => {
    const result = dayKey();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
