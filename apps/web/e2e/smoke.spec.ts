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

async function addSalary(page: Page, name: string, amount: string) {
  await page.getByRole("button", { name: "Add income" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByLabel("Monthly amount").fill(amount);
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
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
      // Animations are switched off so the scan reads final colours, not a half-faded entrance.
      const context = await browser.newContext({ colorScheme, reducedMotion: "reduce" });
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
  await addSalary(page, "Main job", "30000");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("salary-total")).toContainText("30,000");
});

test("deleting a pot can be undone", async ({ page }) => {
  await page.goto("/income-expenses");
  await addSalary(page, "Job", "30000");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  await page.goto("/sinking-funds");
  await page.getByRole("button", { name: "Add a pot" }).first().click();
  const panel = page.getByRole("dialog");
  await panel.getByLabel("Name").fill("Car insurance");
  await panel.getByLabel("Target amount").fill("6000");
  await panel.getByLabel("Due month").fill("2027-04");
  await panel.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: /History.*Car insurance/ }).click();
  await page.getByRole("button", { name: "Delete Car insurance" }).click();
  await expect(page.getByText("Deleted “Car insurance”")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("button", { name: /History.*Car insurance/ })).toBeVisible();
});

test("the sample data loads in one click and can be cleared", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Look around with sample data" }).click();
  await expect(page.getByTestId("demo-banner")).toBeVisible();
  await page.getByRole("button", { name: "Start with my own data" }).click();
  await expect(page.getByTestId("onboarding-welcome")).toBeVisible();
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

test("every page passes the accessibility scan with sample data, in light and dark", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  for (const colorScheme of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Look around with sample data" }).click();
    await expect(page.getByTestId("demo-banner")).toBeVisible();
    const problems: string[] = [];
    for (const path of [...PAGES, "/calendar"]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).analyze();
      for (const v of violations) {
        if (v.impact === "serious" || v.impact === "critical") {
          problems.push(
            `${colorScheme} ${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.html.slice(0, 90)}`,
          );
        }
      }
    }
    await context.close();
    expect(problems).toEqual([]);
  }
});

async function serious(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0]?.html.slice(0, 90)}`);
}

test("an installment added as an expense is listed under installments, with a clean panel", async ({
  browser,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/income-expenses");
    await addSalary(page, "Job", "30000");

    await page.getByRole("button", { name: "Add expense" }).first().click();
    await page.getByRole("radio", { name: /^Installment/ }).click();
    await page.getByLabel("Name", { exact: true }).fill("Phone");
    await page.getByLabel("Monthly payment").fill("1500");
    await page.getByLabel("Payments left").fill("6");
    expect(await serious(page), `${colorScheme} panel`).toEqual([]);
    await page.getByRole("dialog").getByRole("button", { name: "Add", exact: true }).click();

    const group = page.getByTestId("expense-group-installment");
    await expect(group).toContainText("Phone");
    await expect(group).toContainText("6 payments left");
    await expect(page.getByTestId("expense-group-regular")).toHaveCount(0);
    expect(await serious(page), `${colorScheme} list`).toEqual([]);
    await context.close();
  }
});

test("a pot with no goal takes money and cheers, and the basket can be built from an example", async ({
  browser,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Look around with sample data" }).click();
    await expect(page.getByTestId("demo-banner")).toBeVisible();

    await page.goto("/sinking-funds");
    await page.getByRole("button", { name: "Add a pot" }).first().click();
    await page.getByText("Keeps growing", { exact: true }).click();
    await page.getByLabel("Name", { exact: true }).fill("Rainy day");
    await page.getByRole("dialog").getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("No goal or deadline: put in what you like")).toBeVisible();
    await page.getByRole("button", { name: /Add money.*Rainy day/ }).click();
    await page.getByRole("dialog").getByLabel("Amount", { exact: true }).fill("500");
    await page.getByRole("dialog").getByRole("button", { name: "Put in" }).click();
    await expect(page.getByText(/added to Rainy day/)).toBeVisible();

    await page.getByRole("tab", { name: "Investments" }).click();
    await page.getByRole("button", { name: "Use the Balanced basket" }).click();
    await expect(page.getByTestId("basket-total")).toContainText("Adds up to 100%");
    expect(await serious(page), `${colorScheme} basket`).toEqual([]);
    await context.close();
  }
});

test("the home page opens with a short summary, and shows the limits and advice on request", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Look around with sample data" }).click();
  await expect(page.getByTestId("month-summary")).toBeVisible();
  await expect(page.getByTestId("summary-free-spending")).toBeVisible();
  await expect(page.getByTestId("limit-needs")).toBeHidden();

  await page.getByRole("button", { name: "Show details" }).click();
  await expect(page.getByTestId("limit-needs")).toBeVisible();
  await expect(page.getByTestId("limit-advice")).toBeVisible();

  // the choice is remembered
  await page.reload();
  await expect(page.getByTestId("limit-needs")).toBeVisible();
});

test("when the browser lost the data, the app says so and offers a way back", async ({
  browser,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem("stoafi:data-since", "2026-09-01"));
    await page.goto("/");
    await expect(page.getByTestId("data-lost")).toBeVisible();
    await expect(page.getByRole("button", { name: "Restore from a backup file" })).toBeVisible();
    expect(await serious(page), `${colorScheme} lost-data screen`).toEqual([]);
    await page.getByRole("button", { name: "Start again with nothing" }).click();
    await expect(page.getByTestId("onboarding-welcome")).toBeVisible();
    await context.close();
  }
});

test("settings show the three layers of data safety", async ({ page }) => {
  await page.goto("/settings");
  const section = page.getByTestId("safety-section");
  await expect(section).toBeVisible();
  await expect(section.getByText("Does the browser keep your data?")).toBeVisible();
  await expect(section.getByText("Automatic backup to a file")).toBeVisible();
  await expect(section.getByText("Copies kept in this browser")).toBeVisible();
});

test("the page is set in Inter from our own files, and Turkish letters use it too", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (r) => requested.push(r.url()));
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/"/g, "")),
  );
  expect(loaded).toContain("Inter");
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/^"?Inter/);
  // the second file is only fetched when a Turkish letter is asked for
  expect(
    await page.evaluate(async () => {
      await document.fonts.load("16px Inter", "ğşİıçöü");
      return document.fonts.check("16px Inter", "ğşİıçöü");
    }),
  ).toBe(true);
  // every request stays on the site itself
  const origin = new URL(page.url()).origin;
  expect(requested.filter((u) => u.startsWith("http") && !u.startsWith(origin))).toEqual([]);
});

test("no page scrolls sideways on a phone in Turkish with sample data", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({
    viewport: { width: 360, height: 740 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "language", { get: () => "tr-TR" }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Örnek verilerle gez" }).click();
  await expect(page.getByTestId("demo-banner")).toBeVisible();
  const wide: string[] = [];
  for (const path of [...PAGES, "/calendar"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    // the home page keeps its details behind a button; open them so the whole page is measured
    const show = page.getByRole("button", { name: "Detayları göster" });
    if (await show.count()) await show.click();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    if (overflows) wide.push(path);
  }
  await context.close();
  expect(wide).toEqual([]);
});
