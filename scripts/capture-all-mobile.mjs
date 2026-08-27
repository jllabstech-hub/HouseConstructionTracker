import { chromium } from "@playwright/test";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = "C:\\Users\\jyoti\\.gemini\\antigravity\\brain\\2f7ac408-909f-417f-9297-ea45152e4ca5";

  const viewports = [
    { name: "375px", width: 375, height: 667 },
    { name: "390px", width: 390, height: 844 },
    { name: "412px", width: 412, height: 915 },
  ];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    // 1. Login Page
    await page.goto("http://localhost:7000/login", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_login.png`), fullPage: false });

    // Perform Login
    await page.fill('input[name="email"]', "admin");
    await page.fill('input[name="password"]', "test123");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // 2. Dashboard
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_dashboard.png`), fullPage: false });

    // 3. Test Bottom Navigation Center Plus (+) Action Sheet
    const plusBtn = page.locator('button[aria-label="Add Expense"]');
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_plus_sheet.png`), fullPage: false });
      // Click Add Material
      await page.click('text=Add Material');
      await page.waitForURL("**/expenses/new**", { timeout: 10000 });
      await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_add_material.png`), fullPage: false });
    }

    // 4. Expenses Page
    await page.goto("http://localhost:7000/expenses", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_expenses.png`), fullPage: false });

    // 5. Stages Page
    await page.goto("http://localhost:7000/stages", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_stages.png`), fullPage: false });

    // 6. Budget Page
    await page.goto("http://localhost:7000/budget", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_budget.png`), fullPage: false });

    // 7. Reports Page
    await page.goto("http://localhost:7000/reports", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_reports.png`), fullPage: false });

    // 8. Documents Page
    await page.goto("http://localhost:7000/documents", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_documents.png`), fullPage: false });

    // 9. Phone Directory
    await page.goto("http://localhost:7000/phonedirectory", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_directory.png`), fullPage: false });

    // 10. Projects Page
    await page.goto("http://localhost:7000/projects", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_projects.png`), fullPage: false });

    // 11. Settings Page
    await page.goto("http://localhost:7000/settings", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, `mobile_${vp.name}_settings.png`), fullPage: false });

    await context.close();
    console.log(`Viewport ${vp.name} completed successfully!`);
  }

  await browser.close();
  console.log("\nAll mobile viewport tests (375px, 390px, 412px) finished!");
}

main().catch(console.error);
