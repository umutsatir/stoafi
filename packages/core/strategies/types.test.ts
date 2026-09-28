import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Strategy } from "./types";

describe("Strategy contract", () => {
  it("accepts a minimal fake strategy object", () => {
    const fakeStrategy: Strategy<{ savingsPct: number }> = {
      id: "fake",
      lessonId: "fake-lesson",
      params: z.object({ savingsPct: z.number() }),
      allocate: () => ({ needs: 0, wants: 0, savings: 0, investing: 0 }),
      diagnose: () => [],
    };

    expect(fakeStrategy.id).toBe("fake");
    expect(fakeStrategy.diagnose).toBeInstanceOf(Function);
  });
});
