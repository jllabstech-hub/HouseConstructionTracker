import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/User ID|Email/).fill("admin");
  await page.getByLabel("Password").fill("test123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
}

test.describe.serial("House Construction Tracker", () => {
  test("login and see dashboard totals", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Total spent")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Material vs labour", exact: true })).toBeVisible();
  });

  test("add material and labour expenses and keep them separate", async ({ page }) => {
    await login(page);
    await page.goto("/expenses/new");
    await page.getByRole("button", { name: "Material" }).click();
    await page.getByLabel("Material category").selectOption({ index: 1 });
    await page.getByPlaceholder("OPC Cement").fill("E2E OPC Cement");
    await page.getByPlaceholder("50").fill("50");
    await page.getByPlaceholder("420").fill("420");
    await expect(page.getByText("₹21,000")).toBeVisible();
    await page.getByRole("button", { name: "Save expense" }).click();
    await expect(page).toHaveURL(/\/expenses/, { timeout: 15_000 });

    await page.goto("/expenses/new");
    await page.getByRole("button", { name: "Labour" }).click();
    await page.getByLabel("Labour category").selectOption({ index: 1 });
    await page.getByPlaceholder("Work done").fill("E2E masonry labour");
    await page.getByLabel("Calculation method").selectOption("DAILY_WAGE");
    await page.getByPlaceholder("5").fill("5");
    await page.getByPlaceholder("4").fill("4");
    await page.getByPlaceholder("900").fill("900");
    await expect(page.getByText("₹18,000")).toBeVisible();
    await page.getByRole("button", { name: "Save expense" }).click();

    await page.goto("/expenses");
    await page.getByPlaceholder("Search description, vendor, worker, category").fill("E2E OPC Cement");
    await expect(page.getByRole("cell", { name: "E2E OPC Cement" }).first()).toBeVisible();

    await page.getByPlaceholder("Search description, vendor, worker, category").fill("E2E masonry labour");
    await expect(page.getByRole("cell", { name: "E2E masonry labour" }).first()).toBeVisible();
  });

  test("budget vs actual and PDF generation", async ({ page, request }) => {
    await login(page);
    await page.goto("/budget");
    await expect(page.getByText("Budget vs actual")).toBeVisible();
    await expect(page.getByText("OVER BUDGET").or(page.getByText("WITHIN BUDGET")).first()).toBeVisible();

    await page.goto("/reports");
    await expect(page.getByText("Work-wise construction cost")).toBeVisible();

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    const projectId = "demo-whitefield-house";
    const pdf = await request.get(`/api/reports/pdf?projectId=${projectId}&kind=total`, {
      headers: { cookie: cookieHeader },
    });
    expect(pdf.ok()).toBeTruthy();
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    const disposition = pdf.headers()["content-disposition"] ?? "";
    expect(disposition).toMatch(/house-.*\.pdf/);
  });
});
