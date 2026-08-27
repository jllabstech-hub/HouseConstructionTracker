import { chromium } from "@playwright/test";
import path from "path";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = "C:\\Users\\jyoti\\.gemini\\antigravity\\brain\\2f7ac408-909f-417f-9297-ea45152e4ca5";

  // 1. Desktop Reports View (1280x900)
  console.log("Capturing Desktop Reports View...");
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  
  await desktopPage.goto("http://localhost:7000/login", { waitUntil: "networkidle" });
  await desktopPage.fill('input[name="email"]', "admin");
  await desktopPage.fill('input[name="password"]', "test123");
  await desktopPage.click('button[type="submit"]');
  await desktopPage.waitForURL("**/dashboard", { timeout: 15000 });

  await desktopPage.goto("http://localhost:7000/reports", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(2000);

  const desktopPath = path.join(artifactDir, "reports_redesign_desktop.png");
  await desktopPage.screenshot({ path: desktopPath, fullPage: true });
  console.log("Desktop Reports screenshot saved:", desktopPath);

  // 2. Mobile Reports View (390x844)
  console.log("Capturing Mobile Reports View...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  
  await mobilePage.goto("http://localhost:7000/login", { waitUntil: "networkidle" });
  await mobilePage.fill('input[name="email"]', "admin");
  await mobilePage.fill('input[name="password"]', "test123");
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL("**/dashboard", { timeout: 15000 });

  await mobilePage.goto("http://localhost:7000/reports", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(2000);

  const mobilePath = path.join(artifactDir, "reports_redesign_mobile.png");
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log("Mobile Reports screenshot saved:", mobilePath);

  await browser.close();
}

main().catch(console.error);
