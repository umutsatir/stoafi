import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { guardsModule } from "./module";

describe("guardsModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(guardsModule)).not.toThrow();
  });

  it("collecting contributes.guards via the registry returns the 3 default rules", () => {
    const registry = createRegistry();
    registry.register(guardsModule);
    const guards = registry.listModules().flatMap((m) => m.contributes?.guards ?? []);
    expect(guards).toHaveLength(3);
    expect(guards.map((g) => g.id).sort()).toEqual(
      ["emergency-fund-floor", "installment-cap", "wants-limit"].sort(),
    );
  });
});
