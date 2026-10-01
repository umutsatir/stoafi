import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia; the theme code asks for the system colour scheme. Tests start in light.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}
