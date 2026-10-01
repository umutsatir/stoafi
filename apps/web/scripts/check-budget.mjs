// Fails when the static export grows past the written budget (docs/QUALITY-BUDGET.md).
// Sizes are gzip bytes, which is what a phone downloads.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const budget = JSON.parse(readFileSync(join(here, "../quality-budget.json"), "utf8"));
const root = join(here, "../out/_next/static");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sizeOf = (path) => gzipSync(readFileSync(path)).length;
const js = walk(root).filter((p) => p.endsWith(".js"));
const css = walk(root).filter((p) => p.endsWith(".css"));
const kb = (n) => Math.round(n / 1024);

const sums = {
  totalJsKb: kb(js.reduce((a, p) => a + sizeOf(p), 0)),
  largestJsKb: kb(Math.max(...js.map(sizeOf))),
  totalCssKb: kb(css.reduce((a, p) => a + sizeOf(p), 0)),
};

let failed = false;
for (const [key, limit] of Object.entries(budget)) {
  const ok = sums[key] <= limit;
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "FAIL"} ${key}: ${sums[key]} KB (budget ${limit} KB)`);
}
process.exit(failed ? 1 : 0);
