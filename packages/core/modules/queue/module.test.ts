import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { queueModule } from "./module";

describe("queueModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(queueModule)).not.toThrow();
  });
});
