import { describe, expect, it } from "vitest";
import { createRegistry } from "../../kernel/registry";
import { installmentsModule } from "./module";
import { compareOffers } from "./selectors";

describe("installmentsModule", () => {
  it("registers via the kernel registry without error", () => {
    const registry = createRegistry();
    expect(() => registry.register(installmentsModule)).not.toThrow();
  });

  it("exposes compareOffers as a selector matching the direct export", () => {
    const offers = [{ months: 3, payments: [400, 400, 400] }];
    const direct = compareOffers(1200, offers, 0.3);
    const viaModule = installmentsModule.selectors.compareOffers as typeof compareOffers;
    expect(viaModule(1200, offers, 0.3)).toEqual(direct);
  });
});
