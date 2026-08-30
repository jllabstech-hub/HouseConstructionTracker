import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("admin or user@example.com").fill("admin");
  await page.getByPlaceholder("Password").fill("test123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
}

test.describe.serial("House Construction Tracker", () => {
  test("login and see dashboard totals", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Total spent").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Where is the Money Going?" })).toBeVisible();
  });

  test("add material and labour expenses and keep them separate", async ({ page }) => {
    await login(page);
    await page.goto("/expenses/new");
    await page.getByRole("radio", { name: /Material/i }).click();
    await page.getByLabel(/Material Category/i).selectOption({ index: 1 });
    await page.locator("#material-description").fill("E2E OPC Cement");
    await page.locator("#material-quantity").fill("50");
    await page.locator("#material-rate").fill("420");
    await expect(page.getByText("₹21,000", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Save Expense/i }).click();
    await page.getByRole("link", { name: /All Expenses/i }).click();
    await expect(page).toHaveURL(/\/expenses/, { timeout: 15_000 });

    await page.goto("/expenses/new");
    await page.getByRole("radio", { name: /Labour/i }).click();
    await page.getByLabel(/Labour Category/i).selectOption({ index: 1 });
    await page.locator("#labour-description").fill("E2E masonry labour");
    await page.getByRole("button", { name: /Daily Wage/i }).click();
    await page.locator("#labour-workers-count").fill("5");
    await page.locator("#labour-days-count").fill("4");
    await page.locator("#labour-daily-rate").fill("900");
    await expect(page.getByText("₹18,000", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Save Expense/i }).click();
    await page.getByRole("link", { name: /All Expenses/i }).click();
    await expect(page).toHaveURL(/\/expenses/, { timeout: 15_000 });

    await page.goto("/expenses");
    await page.getByPlaceholder("Search expenses...").fill("E2E OPC Cement");
    await expect(page.locator("table").getByText("E2E OPC Cement").first()).toBeVisible();

    await page.getByPlaceholder("Search expenses...").fill("E2E masonry labour");
    await expect(page.locator("table").getByText("E2E masonry labour").first()).toBeVisible();
  });

  test("budget vs actual and PDF generation", async ({ page, request }) => {
    await login(page);
    await page.goto("/budget");
    await expect(page.getByText("Budget & Allocations")).toBeVisible();
    await expect(page.getByText("Budget (Planned)").first()).toBeVisible();

    await page.goto("/reports");
    await expect(page.getByText(/Reports & PDF Statements|Quick reports/i).first()).toBeVisible();

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
