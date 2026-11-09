import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./use-media-query";

describe("useMediaQuery", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns false where the browser has no matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => useMediaQuery("(max-width: 639px)"));
    expect(result.current).toBe(false);
  });

  it("returns whether the query matches", () => {
    vi.stubGlobal(
      "matchMedia",
      (q: string) =>
        ({
          matches: q === "(max-width: 639px)",
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
    const { result } = renderHook(() => useMediaQuery("(max-width: 639px)"));
    expect(result.current).toBe(true);
  });
});
