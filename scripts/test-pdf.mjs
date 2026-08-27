import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Logging in to test PDF generation...");
  await page.goto("http://localhost:7000/login", { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', "admin");
  await page.fill('input[name="password"]', "test123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });

  await page.goto("http://localhost:7000/reports", { waitUntil: "networkidle" });
  const downloadHref = await page.getAttribute('a:has-text("Download PDF")', "href");
  console.log("Found PDF URL on page:", downloadHref);

  // Test with page.request.get
  const res = await page.request.get(`http://localhost:7000${downloadHref}`);
  console.log("PDF Response status:", res.status());
  console.log("Content-Type:", res.headers()["content-type"]);
  const body = await res.body();
  console.log("PDF Body size in bytes:", body.length);
  console.log("PDF Header bytes:", body.slice(0, 5).toString()); // Should be "%PDF-"

  if (res.status() === 200 && res.headers()["content-type"]?.includes("pdf") && body.slice(0, 5).toString() === "%PDF-") {
    console.log("PDF Generation Test: SUCCESS (Valid %PDF- stream of length " + body.length + " bytes)");
  } else {
    console.error("PDF Generation Test: FAILED");
  }

  await browser.close();
}

main().catch(console.error);
