import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Strategy } from "./types";

describe("Strategy contract", () => {
  it("accepts a minimal fake strategy object", () => {
    const fakeStrategy: Strategy<{ savingsPct: number }> = {
      id: "fake",
      lesson: {
        id: "fake-lesson",
        title: "Fake lesson",
        source: { author: "Fake Author", work: "Fake Work" },
        principle: "A fake principle for testing.",
        fitsWhen: "Never — test fixture only.",
        critique: "N/A.",
      },
      params: z.object({ savingsPct: z.number() }),
      allocate: () => ({ needs: 0, wants: 0, savings: 0, investing: 0 }),
      diagnose: () => [],
    };

    expect(fakeStrategy.id).toBe("fake");
    expect(fakeStrategy.diagnose).toBeInstanceOf(Function);
  });
});
