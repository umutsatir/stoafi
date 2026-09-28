import { describe, expect, it } from "vitest";
import { cooldownStatus } from "./cooldown";

describe("cooldownStatus", () => {
  it("a need is never subject to cooldown", () => {
    const result = cooldownStatus({ isNeed: true, addedDate: "2026-09-01" }, "2026-09-01");
    expect(result.active).toBe(false);
  });

  it("a want dated 29 days before today is still active", () => {
    const result = cooldownStatus({ isNeed: false, addedDate: "2026-09-01" }, "2026-09-30");
    expect(result.active).toBe(true);
  });

  it("a want dated 30 days before today is no longer active", () => {
    const result = cooldownStatus({ isNeed: false, addedDate: "2026-09-01" }, "2026-10-01");
    expect(result.active).toBe(false);
  });

  it("respects a custom cooldownDays override", () => {
    const active10 = cooldownStatus({ isNeed: false, addedDate: "2026-09-01" }, "2026-09-09", 10);
    const inactive10 = cooldownStatus({ isNeed: false, addedDate: "2026-09-01" }, "2026-09-11", 10);
    expect(active10.active).toBe(true);
    expect(inactive10.active).toBe(false);
  });

  it("returns the endsOn date the cooldown lifts", () => {
    const result = cooldownStatus({ isNeed: false, addedDate: "2026-09-01" }, "2026-09-05");
    expect(result.endsOn).toBe("2026-10-01");
  });
});
