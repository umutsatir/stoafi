import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { backupModule } from "./module";

describe("backupModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(backupModule)).not.toThrow();
  });
});
