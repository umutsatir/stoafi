import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { decisionsModule } from "./module";

describe("decisionsModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(decisionsModule)).not.toThrow();
  });
});
