import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:/Users/jyoti/.gemini/antigravity/brain/95f26e66-ab89-4f4a-978f-d17c76b9ce52/screenshots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });

  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('http://localhost:7000/login');
  await page.fill('input[name="email"]', 'admin');
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('Logged in successfully');

  // 1. New Expense - Stage Ordered
  console.log('Capturing Expense Form with Construction Stages...');
  await page.goto('http://localhost:7000/expenses/new');
  await page.waitForSelector('form');
  await page.screenshot({ path: path.join(OUT_DIR, '05_new_expense.png'), fullPage: true });

  // 2. Click a stage (e.g. Masonry / Brickwork) and click a preset chip
  console.log('Clicking Stage 7 Masonry and applying preset...');
  const masonryBtn = page.locator('button:has-text("Masonry")').first();
  if (await masonryBtn.count() > 0) {
    await masonryBtn.click();
    await page.waitForTimeout(500);
    const blockPreset = page.locator('button:has-text("Solid Concrete Blocks")').first();
    if (await blockPreset.count() > 0) {
      await blockPreset.click();
      await page.waitForTimeout(500);
    }
  }
  await page.screenshot({ path: path.join(OUT_DIR, '05b_new_expense_stage_preset.png'), fullPage: true });

  // 3. Expenses Passbook - Stage Ordered
  console.log('Capturing Expenses Passbook with Stage Ordering & Filter...');
  await page.goto('http://localhost:7000/expenses');
  await page.waitForSelector('table');
  await page.screenshot({ path: path.join(OUT_DIR, '04_expenses_ledger.png'), fullPage: true });

  // 4. Masters - Stage Ordered
  console.log('Capturing Masters with Stage-ordered Catalog...');
  await page.goto('http://localhost:7000/masters');
  const matTab = page.locator('button:has-text("Materials Catalog")').first();
  if (await matTab.count() > 0) {
    await matTab.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(OUT_DIR, '08_masters_directory.png'), fullPage: true });

  // 5. Reports Hub - Stage-Wise statement
  console.log('Capturing Reports Hub with Stage-wise Statement...');
  await page.goto('http://localhost:7000/reports');
  await page.waitForSelector('h1, h2');
  await page.screenshot({ path: path.join(OUT_DIR, '07_reports.png'), fullPage: true });

  // 6. Mobile Views
  console.log('Capturing Mobile Views...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:7000/login');
  await mobilePage.fill('input[name="email"]', 'admin');
  await mobilePage.fill('input[name="password"]', 'test123');
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL('**/dashboard');

  await mobilePage.goto('http://localhost:7000/expenses/new');
  await mobilePage.waitForSelector('form');
  await mobilePage.screenshot({ path: path.join(OUT_DIR, 'm02_mobile_add_expense.png'), fullPage: true });

  await mobilePage.goto('http://localhost:7000/expenses');
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(OUT_DIR, 'm03_mobile_passbook.png'), fullPage: true });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
