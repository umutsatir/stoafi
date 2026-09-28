import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { profileModule } from "./module";

describe("profileModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(profileModule)).not.toThrow();
  });
});
