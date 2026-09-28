import { describe, expect, it } from "vitest";
import { costInWorkHours, costPerUse } from "./selectors";

describe("costInWorkHours", () => {
  it("matches price / hourlyNetIncome", () => {
    expect(costInWorkHours(2000, 200)).toBe(10);
  });

  it("returns a defined sentinel (0) when hourlyNetIncome is 0, without throwing", () => {
    expect(() => costInWorkHours(2000, 0)).not.toThrow();
    expect(costInWorkHours(2000, 0)).toBe(0);
  });
});

describe("costPerUse", () => {
  it("matches price / expectedUses", () => {
    expect(costPerUse(1000, 10)).toBe(100);
  });

  it("returns a defined sentinel (0) when expectedUses is 0, without throwing", () => {
    expect(() => costPerUse(1000, 0)).not.toThrow();
    expect(costPerUse(1000, 0)).toBe(0);
  });
});
