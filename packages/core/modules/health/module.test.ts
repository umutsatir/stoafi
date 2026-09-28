import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { healthModule } from "./module";
import { emergencyFundMonths } from "./selectors";

describe("healthModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(healthModule)).not.toThrow();
  });

  it("exposes emergencyFundMonths matching the direct export", () => {
    const viaModule = healthModule.selectors.emergencyFundMonths as typeof emergencyFundMonths;
    expect(viaModule(30000, 5000)).toBe(emergencyFundMonths(30000, 5000));
  });
});
