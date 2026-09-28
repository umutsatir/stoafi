import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { Module } from "./module";

describe("Module contract", () => {
  it("accepts a minimal conforming module object", () => {
    const schema = z.object({ label: z.string() });

    const fakeModule: Module<typeof schema> = {
      id: "fake",
      version: 1,
      schema,
      migrations: [],
      selectors: {
        double: (n: number) => n * 2,
      },
    };

    expect(fakeModule.id).toBe("fake");
    expect(typeof fakeModule.selectors.double).toBe("function");
  });
});
