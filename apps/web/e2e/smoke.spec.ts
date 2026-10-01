import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = [
  "/",
  "/income-expenses",
  "/profile",
  "/plan",
  "/queue",
  "/sinking-funds",
  "/cards",
  "/health",
  "/decisions",
  "/lessons",
  "/settings",
];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

for (const path of PAGES) {
  test(`${path} opens without errors and fits a phone screen`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 390, height: 780 });
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows, "page scrolls sideways on a phone").toBe(false);

    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator("h1")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${path} has no serious accessibility problems in light and dark`, async ({ browser }) => {
    for (const colorScheme of ["light", "dark"] as const) {
      const context = await browser.newContext({ colorScheme });
      const page = await context.newPage();
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      const serious = violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => `${colorScheme}: ${v.id} (${v.nodes.length}) ${v.help}`);
      await context.close();
      expect(serious).toEqual([]);
    }
  });
}

test("saving income shows a confirmation and survives a reload", async ({ page }) => {
  await page.goto("/income-expenses");
  await page.getByLabel("Salary 1 name").fill("Main job");
  await page.getByLabel("Salary 1 amount").fill("30000");
  await page.getByRole("button", { name: /^save/i }).first().click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Salary 1 amount")).toHaveValue("30000");
});

test("deleting a saved goal can be undone", async ({ page }) => {
  await page.goto("/sinking-funds");
  await page.getByLabel("Name").fill("Car insurance");
  await page.getByLabel("Target amount").fill("6000");
  await page.getByLabel("Due month").fill("2027-04");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete Car insurance" })).toBeVisible();

  await page.getByRole("button", { name: "Delete Car insurance" }).click();
  await expect(page.getByText("Deleted “Car insurance”")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: "Delete Car insurance" })).toBeVisible();
});

test("a card added from a bank shows as a card and passes the accessibility scan", async ({
  page,
}) => {
  await page.goto("/cards");
  await page.getByRole("button", { name: "Garanti BBVA" }).click();
  await page.getByLabel("Card name").fill("Bonus");
  await page.getByLabel("Credit limit").fill("50000");
  await page.getByRole("dialog").getByRole("button", { name: "Add card" }).click();
  await expect(page.getByRole("button", { name: "Open Bonus" })).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.help}`),
  ).toEqual([]);
});
