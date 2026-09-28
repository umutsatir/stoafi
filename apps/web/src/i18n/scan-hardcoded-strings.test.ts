import { describe, expect, it } from "vitest";
import { scanForHardcodedStrings } from "./scan-hardcoded-strings";

describe("scanForHardcodedStrings", () => {
  it("flags plain JSX text as a hard-coded string", () => {
    const source = `export function C() { return <h1>Profile</h1>; }`;
    const violations = scanForHardcodedStrings(source, "fixture.tsx");
    expect(violations.some((v) => v.text === "Profile")).toBe(true);
  });

  it("flags a non-allow-listed JSX attribute string", () => {
    const source = `export function C() { return <button aria-label="Move item up" />; }`;
    const violations = scanForHardcodedStrings(source, "fixture.tsx");
    expect(violations.some((v) => v.text.includes("Move item up"))).toBe(true);
  });

  it("does not flag translation function output", () => {
    const source = `
      export function C() {
        const t = useTranslations("nav");
        return <h1>{t("profile")}</h1>;
      }
    `;
    const violations = scanForHardcodedStrings(source, "fixture.tsx");
    expect(violations).toHaveLength(0);
  });

  it("does not flag allow-listed attributes like className or data-testid", () => {
    const source = `export function C() { return <div className="wants-row" data-testid="row-1" />; }`;
    const violations = scanForHardcodedStrings(source, "fixture.tsx");
    expect(violations).toHaveLength(0);
  });

  it("does not flag whitespace-only or single-character JSX text", () => {
    const source = `export function C() { return <span> </span>; }`;
    const violations = scanForHardcodedStrings(source, "fixture.tsx");
    expect(violations).toHaveLength(0);
  });
});
