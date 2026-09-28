import { describe, expect, it } from "vitest";
import { suggestedEmergencyFundMonth } from "./suggested-emergency-fund";

describe("suggestedEmergencyFundMonth", () => {
  it("returns fromMonth when the target is already met", () => {
    // target = 5000*6=30000, currentSavings 30000 -> gap 0
    const result = suggestedEmergencyFundMonth(30000, 5000, 6, 1000, "2026-01");
    expect(result).toBe("2026-01");
  });

  it("returns fromMonth when the gap is zero regardless of surplus", () => {
    const result = suggestedEmergencyFundMonth(30000, 5000, 6, 0, "2026-01");
    expect(result).toBe("2026-01");
  });

  it("matches a hand-computed month for a normal case", () => {
    // target = 5000*6=30000, currentSavings 0 -> gap 30000, surplus 3000/mo -> 10 months
    const result = suggestedEmergencyFundMonth(0, 5000, 6, 3000, "2026-01");
    expect(result).toBe("2026-11");
  });

  it("rounds up a partial month", () => {
    // gap 10000, surplus 3000/mo -> 3.33 -> rounds up to 4 months
    const result = suggestedEmergencyFundMonth(20000, 5000, 6, 3000, "2026-01");
    expect(result).toBe("2026-05");
  });

  it("returns null when surplus is non-positive and the gap is still positive", () => {
    expect(suggestedEmergencyFundMonth(0, 5000, 6, 0, "2026-01")).toBeNull();
    expect(suggestedEmergencyFundMonth(0, 5000, 6, -500, "2026-01")).toBeNull();
  });
});
