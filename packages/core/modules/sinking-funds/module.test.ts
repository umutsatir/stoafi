import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { sinkingFundsModule } from "./module";
import { monthlySetAside } from "./selectors";

describe("sinkingFundsModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(sinkingFundsModule)).not.toThrow();
  });

  it("exposes monthlySetAside matching the direct export", () => {
    const viaModule = sinkingFundsModule.selectors.monthlySetAside as typeof monthlySetAside;
    expect(viaModule(6000, 0, 6)).toBe(monthlySetAside(6000, 0, 6));
  });
});
