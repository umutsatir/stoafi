import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from "./csp";

const directive = (name: string): string[] =>
  (CONTENT_SECURITY_POLICY.split("; ").find((d) => d.startsWith(`${name} `)) ?? "")
    .split(" ")
    .slice(1);

describe("content security policy", () => {
  it("lets the page talk only to itself, so no data can leave through a fetch", () => {
    expect(directive("connect-src")).toEqual(["'self'"]);
    expect(directive("default-src")).toEqual(["'self'"]);
  });

  it("allows no remote script, style, image or font source", () => {
    for (const name of ["script-src", "style-src", "img-src", "font-src"]) {
      const sources = directive(name);
      expect(
        sources.some((s) => s.startsWith("http") || s === "*"),
        name,
      ).toBe(false);
    }
  });

  it("forbids plugins and base tag tricks", () => {
    expect(directive("object-src")).toEqual(["'none'"]);
    expect(directive("base-uri")).toEqual(["'self'"]);
  });
});

describe("the _headers file for static hosts", () => {
  const file = readFileSync(join(__dirname, "../../public/_headers"), "utf8");

  it("sets every header in SECURITY_HEADERS to exactly the same value", () => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(file).toContain(`${name}: ${value}`);
    }
  });

  it("applies to every path", () => {
    expect(file.trimStart().startsWith("/*")).toBe(true);
  });
});

describe("vercel.json", () => {
  const config = JSON.parse(readFileSync(join(__dirname, "../../../../vercel.json"), "utf8")) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const all = config.headers.find((h) => h.source === "/(.*)")?.headers ?? [];

  it("sets every header in SECURITY_HEADERS to exactly the same value, on every path", () => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(all.find((h) => h.key === name)?.value, name).toBe(value);
    }
  });

  it("keeps the service worker file from being cached, so updates reach people", () => {
    const sw = config.headers.find((h) => h.source === "/sw.js")?.headers ?? [];
    expect(sw).toContainEqual({ key: "Cache-Control", value: "no-cache" });
  });
});
