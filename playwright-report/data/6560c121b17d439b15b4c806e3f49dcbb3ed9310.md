# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-path.spec.ts >> Critical Path E2E >> review page â€” redirects unauthenticated users to login
- Location: tests\e2e\critical-path.spec.ts:48:3

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/review$/
Received string: "http://localhost:3001/review"
Timeout: 5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3001/review"

```

```yaml
- region "Notifications alt+T"
- text: Loading…
```

# Test source

```ts
  1   | ﻿import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("Critical Path E2E", () => {
  4   | 
  5   |   // ---------------------------------------------------------------
  6   |   // 1. Landing page loads and has correct SEO metadata
  7   |   // ---------------------------------------------------------------
  8   |   test("landing page â€” loads with correct title and CTA", async ({ page }) => {
  9   |     await page.goto("/");
  10  |     await expect(page).toHaveTitle(/CodeWise/);
  11  |     // Primary CTA button should be visible
  12  |     const cta = page.getByRole("link", { name: /start free review|get started|start coding|try free/i });
  13  |     await expect(cta.first()).toBeVisible();
  14  |   });
  15  | 
  16  |   test("landing page â€” has meta description", async ({ page }) => {
  17  |     await page.goto("/");
  18  |     const meta = page.locator("meta[name='description']");
  19  |     await expect(meta).toHaveAttribute("content", /.+/);
  20  |   });
  21  | 
  22  |   // ---------------------------------------------------------------
  23  |   // 2. Login flow
  24  |   // ---------------------------------------------------------------
  25  |   test("login page â€” renders and shows sign-in with Google", async ({ page }) => {
  26  |     await page.goto("/login");
  27  |     await expect(page.locator("h1, h2").first()).toContainText(/log in|sign in|welcome/i, { ignoreCase: true });
  28  |     // Google OAuth button should exist on login page
  29  |     const googleBtn = page.getByRole("button", { name: /google|continue with/i });
  30  |     if (await googleBtn.count() > 0) {
  31  |       await expect(googleBtn.first()).toBeVisible();
  32  |     }
  33  |   });
  34  | 
  35  |   test("login page â€” email/password form is present", async ({ page }) => {
  36  |     await page.goto("/login");
  37  |     // Email input and password input should exist
  38  |     const emailInput = page.locator("input[type='email']");
  39  |     const passwordInput = page.locator("input[type='password']");
  40  |     // At least one of these patterns should be present
  41  |     const hasEmailOrOAuth = (await emailInput.count()) > 0 || (await passwordInput.count()) > 0;
  42  |     expect(hasEmailOrOAuth).toBe(true);
  43  |   });
  44  | 
  45  |   // ---------------------------------------------------------------
  46  |   // 3. Review page â€” unauthenticated redirect
  47  |   // ---------------------------------------------------------------
  48  |   test("review page â€” redirects unauthenticated users to login", async ({ page }) => {
  49  |     await page.goto("/review");
  50  |     // Should redirect to login or show an auth-gated page
> 51  |     await expect(page).not.toHaveURL(/\/review$/);
      |                            ^ Error: expect(page).not.toHaveURL(expected) failed
  52  |   });
  53  | 
  54  |   // ---------------------------------------------------------------
  55  |   // 4. Learn page â€” public content loads
  56  |   // ---------------------------------------------------------------
  57  |   test("learn page â€” topic content renders", async ({ page }) => {
  58  |     await page.goto("/learn/arrays");
  59  |     // Should render educational content
  60  |     await expect(page.locator("h1")).toContainText(/arrays/i);
  61  |     // Should have some content (not an error page)
  62  |     await expect(page.locator("body")).not.toContainText(/error/i);
  63  |   });
  64  | 
  65  |   test("learn page â€” invalid slug shows 404 or redirect", async ({ page }) => {
  66  |     await page.goto("/learn/nonexistent-topic-xyz");
  67  |     // Should show error page, redirect, or return 404
  68  |     const title = await page.title();
  69  |     expect(title).toBeTruthy(); // Page loads (not a crash)
  70  |   });
  71  | 
  72  |   // ---------------------------------------------------------------
  73  |   // 5. Practice page â€” unauthenticated redirect
  74  |   // ---------------------------------------------------------------
  75  |   test("practice page â€” redirects unauthenticated users", async ({ page }) => {
  76  |     await page.goto("/practice");
  77  |     await expect(page).not.toHaveURL(/\/practice$/);
  78  |   });
  79  | 
  80  |   // ---------------------------------------------------------------
  81  |   // 6. Pricing page â€” renders plan options
  82  |   // ---------------------------------------------------------------
  83  |   test("pricing page â€” renders plan options", async ({ page }) => {
  84  |     await page.goto("/pricing");
  85  |     await expect(page.locator("h1, h2").first().first()).toContainText(/pricing|plans/i, { ignoreCase: true });
  86  |     // Should show at least Free and Pro
  87  |     const pageContent = await page.textContent("body");
  88  |     expect(pageContent).toMatch(/free|pro/i);
  89  |   });
  90  | 
  91  |   // ---------------------------------------------------------------
  92  |   // 7. Shared submission page â€” public access
  93  |   // ---------------------------------------------------------------
  94  |   test("shared submission â€” invalid ID shows error gracefully", async ({ page }) => {
  95  |     await page.goto("/s/00000000-0000-0000-0000-000000000000");
  96  |     // Should handle gracefully â€” not crash
  97  |     const title = await page.title();
  98  |     expect(title).toBeTruthy();
  99  |   });
  100 | 
  101 |   // ---------------------------------------------------------------
  102 |   // 8. Terms page â€” loads
  103 |   // ---------------------------------------------------------------
  104 |   test("terms page â€” loads without error", async ({ page }) => {
  105 |     await page.goto("/terms");
  106 |     await expect(page).toHaveTitle(/terms/i);
  107 |   });
  108 | 
  109 |   // ---------------------------------------------------------------
  110 |   // 9. Privacy page â€” loads
  111 |   // ---------------------------------------------------------------
  112 |   test("privacy page â€” loads without error", async ({ page }) => {
  113 |     await page.goto("/privacy");
  114 |     await expect(page).toHaveTitle(/privacy/i);
  115 |   });
  116 | });
  117 | 
  118 | 
  119 | 
```