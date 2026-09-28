import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { cardsModule } from "./module";

describe("cardsModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(cardsModule)).not.toThrow();
  });
});
