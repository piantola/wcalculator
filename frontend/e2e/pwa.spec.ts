import { test, expect } from "@playwright/test";

test.describe("PWA meta tags", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("link do manifesto presente no head", async ({ page }) => {
    const manifest = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifest).toBeTruthy();
  });

  test("meta theme-color presente", async ({ page }) => {
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute("content");
    expect(themeColor).toBe("#032147");
  });

  test("apple-mobile-web-app-capable presente", async ({ page }) => {
    const capable = await page
      .locator('meta[name="apple-mobile-web-app-capable"]')
      .getAttribute("content");
    expect(capable).toBe("yes");
  });
});
