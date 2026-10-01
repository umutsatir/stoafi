import { describe, expect, it } from "vitest";
import { crossedMilestone } from "./savings-cheer";

describe("crossedMilestone", () => {
  it("names the milestone a deposit just crossed", () => {
    expect(crossedMilestone(0, 30, 100)).toBe(25);
    expect(crossedMilestone(30, 55, 100)).toBe(50);
    expect(crossedMilestone(55, 80, 100)).toBe(75);
    expect(crossedMilestone(80, 100, 100)).toBe(100);
  });

  it("names the highest one when a deposit jumps over several", () => {
    expect(crossedMilestone(0, 80, 100)).toBe(75);
    expect(crossedMilestone(10, 150, 100)).toBe(100);
  });

  it("is quiet when no milestone is crossed", () => {
    expect(crossedMilestone(30, 40, 100)).toBeNull();
    expect(crossedMilestone(100, 120, 100)).toBeNull();
  });

  it("counts exactly reaching a milestone, and never cheers for a withdrawal", () => {
    expect(crossedMilestone(49, 50, 100)).toBe(50);
    expect(crossedMilestone(80, 20, 100)).toBeNull();
    expect(crossedMilestone(50, 50, 100)).toBeNull();
  });

  it("has no milestones for a pot without a target", () => {
    expect(crossedMilestone(0, 1_000_000, 0)).toBeNull();
  });
});
