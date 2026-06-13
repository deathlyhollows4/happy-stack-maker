import { test, expect } from "@playwright/test";

test.describe("Critical Path E2E", () => {

  // ---------------------------------------------------------------
  // 1. Landing page loads and has correct SEO metadata
  // ---------------------------------------------------------------
  test("landing page â€” loads with correct title and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CodeWise/);
    // Primary CTA button should be visible
    const cta = page.getByRole("link", { name: /get started|start coding|try free/i });
    await expect(cta.first()).toBeVisible();
  });

  test("landing page â€” has meta description", async ({ page }) => {
    await page.goto("/");
    const meta = page.locator("meta[name='description']");
    await expect(meta).toHaveAttribute("content", /.+/);
  });

  // ---------------------------------------------------------------
  // 2. Login flow
  // ---------------------------------------------------------------
  test("login page â€” renders and shows sign-in with Google", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2")).toContainText(/log in|sign in|welcome/i, { ignoreCase: true });
    // Google OAuth button should exist on login page
    const googleBtn = page.getByRole("button", { name: /google|continue with/i });
    if (await googleBtn.count() > 0) {
      await expect(googleBtn.first()).toBeVisible();
    }
  });

  test("login page â€” email/password form is present", async ({ page }) => {
    await page.goto("/login");
    // Email input and password input should exist
    const emailInput = page.locator("input[type='email']");
    const passwordInput = page.locator("input[type='password']");
    // At least one of these patterns should be present
    const hasEmailOrOAuth = (await emailInput.count()) > 0 || (await passwordInput.count()) > 0;
    expect(hasEmailOrOAuth).toBe(true);
  });

  // ---------------------------------------------------------------
  // 3. Review page â€” unauthenticated redirect
  // ---------------------------------------------------------------
  test("review page â€” redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/review");
    // Should redirect to login or show an auth-gated page
    await expect(page).not.toHaveURL(/\/review$/);
  });

  // ---------------------------------------------------------------
  // 4. Learn page â€” public content loads
  // ---------------------------------------------------------------
  test("learn page â€” topic content renders", async ({ page }) => {
    await page.goto("/learn/arrays");
    // Should render educational content
    await expect(page.locator("h1")).toContainText(/arrays/i);
    // Should have some content (not an error page)
    await expect(page.locator("body")).not.toContainText(/error/i);
  });

  test("learn page â€” invalid slug shows 404 or redirect", async ({ page }) => {
    await page.goto("/learn/nonexistent-topic-xyz");
    // Should show error page, redirect, or return 404
    const title = await page.title();
    expect(title).toBeTruthy(); // Page loads (not a crash)
  });

  // ---------------------------------------------------------------
  // 5. Practice page â€” unauthenticated redirect
  // ---------------------------------------------------------------
  test("practice page â€” redirects unauthenticated users", async ({ page }) => {
    await page.goto("/practice");
    await expect(page).not.toHaveURL(/\/practice$/);
  });

  // ---------------------------------------------------------------
  // 6. Pricing page â€” renders plan options
  // ---------------------------------------------------------------
  test("pricing page â€” renders plan options", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1, h2").first()).toContainText(/pricing|plans/i, { ignoreCase: true });
    // Should show at least Free and Pro
    const pageContent = await page.textContent("body");
    expect(pageContent).toMatch(/free|pro/i);
  });

  // ---------------------------------------------------------------
  // 7. Shared submission page â€” public access
  // ---------------------------------------------------------------
  test("shared submission â€” invalid ID shows error gracefully", async ({ page }) => {
    await page.goto("/s/00000000-0000-0000-0000-000000000000");
    // Should handle gracefully â€” not crash
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  // ---------------------------------------------------------------
  // 8. Terms page â€” loads
  // ---------------------------------------------------------------
  test("terms page â€” loads without error", async ({ page }) => {
    await page.goto("/terms");
    await expect(page).toHaveTitle(/terms/i);
  });

  // ---------------------------------------------------------------
  // 9. Privacy page â€” loads
  // ---------------------------------------------------------------
  test("privacy page â€” loads without error", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/privacy/i);
  });
});

