import { expect, test, type Page } from "@playwright/test";

const PROJECT_REF = process.env.VITE_SUPABASE_PROJECT_ID ?? "zjdxwczuhtdllflroggd";

const fakeUser = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "codex-day4-session6@example.com",
  email_confirmed_at: new Date("2026-06-22T00:00:00.000Z").toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: new Date("2026-06-22T00:00:00.000Z").toISOString(),
  updated_at: new Date("2026-06-22T00:00:00.000Z").toISOString(),
};

const fakeSession = {
  access_token: "codex-day4-session6-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "codex-day4-session6-refresh",
  user: fakeUser,
};

const countPositiveProblem = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Count Positive Numbers",
  prompt: "Return how many numbers in nums are greater than zero.",
  starter_code: [
    "def count_positive(nums):",
    "    # TODO: count values greater than zero",
    "    return 0",
    "",
  ].join("\n"),
  language: "python",
  topic_slug: "arrays",
  planning_context: {
    source: "manual-topic",
    requestedTopicSlug: "arrays",
    selectedTopicSlug: "arrays",
    selectedCurriculumNodeId: "arrays-counting-001",
    selectedCurriculumNodeTitle: "Counting With Arrays",
    selectedMasteryBand: "foundation",
    bridgePreview: null,
  },
  contract_version: "practice_problem_v1",
  curriculum_node_id: "arrays-counting-001",
  mastery_band: "foundation",
  objective: "Count elements that match a simple condition.",
  statement:
    "Write a function that returns the number of values in nums that are greater than zero.",
  topic_tags: [{ label: "Arrays", slug: "arrays" }],
  prerequisite_tags: [{ label: "Comparison", slug: "comparison" }],
  examples: [
    {
      input: "nums = [-1, 0, 2, 5]",
      output: "2",
      explanation: "Only 2 and 5 are positive.",
    },
  ],
  constraints: ["0 <= nums.length <= 100", "-100 <= nums[i] <= 100"],
  function_signature: {
    functionName: "count_positive",
    parameters: [{ name: "nums", type: "number[]" }],
    returnType: "number",
    languageSignatures: [
      {
        language: "python",
        signature: "def count_positive(nums: list[int]) -> int:",
        callableName: "count_positive",
        starterCode: "def count_positive(nums):\n    return 0\n",
      },
      {
        language: "javascript",
        signature: "function countPositive(nums) {}",
        callableName: "countPositive",
        starterCode: "function countPositive(nums) {\n  return 0;\n}\n",
      },
      {
        language: "java",
        signature: "public static int countPositive(int[] nums)",
        callableName: "countPositive",
        starterCode:
          "public class Solution {\n  public static int countPositive(int[] nums) {\n    return 0;\n  }\n}\n",
      },
      {
        language: "cpp",
        signature: "int countPositive(vector<int> nums)",
        callableName: "countPositive",
        starterCode: "int countPositive(vector<int> nums) {\n  return 0;\n}\n",
      },
      {
        language: "go",
        signature: "func CountPositive(nums []int) int",
        callableName: "CountPositive",
        starterCode: "func CountPositive(nums []int) int {\n  return 0\n}\n",
      },
    ],
  },
  visible_tests: [
    {
      id: "visible-1",
      name: "counts positives",
      arguments: [[-1, 0, 2, 5]],
      expected: 2,
      theme: "mixed values",
      comparator: "deepEqual",
      visibility: "visible",
    },
    {
      id: "visible-2",
      name: "empty list",
      arguments: [[]],
      expected: 0,
      theme: "empty input",
      comparator: "deepEqual",
      visibility: "visible",
    },
  ],
  hidden_test_themes: ["all non-positive values", "single positive value"],
  hint_ladder: [
    {
      order: 1,
      title: "Check every number",
      body: "Loop through nums and test each value against zero.",
    },
    {
      order: 2,
      title: "Track a count",
      body: "Increase a counter only when the value is positive.",
    },
  ],
  success_criteria: ["Returns a number", "Does not count zero", "Handles an empty array"],
  generation_status: "structured",
};

const maxValueProblem = {
  ...countPositiveProblem,
  id: "33333333-3333-4333-8333-333333333333",
  title: "Find Maximum Value",
  prompt: "Return the largest number in nums.",
  starter_code: [
    "def max_value(nums):",
    "    # TODO: return the largest value",
    "    return nums[0]",
    "",
  ].join("\n"),
  curriculum_node_id: "arrays-scan-002",
  objective: "Track the best value while scanning an array.",
  statement: "Write a function that returns the largest value in a non-empty list of numbers.",
  function_signature: {
    ...countPositiveProblem.function_signature,
    functionName: "max_value",
    languageSignatures: countPositiveProblem.function_signature.languageSignatures.map(
      (signature) =>
        signature.language === "python"
          ? {
              ...signature,
              signature: "def max_value(nums: list[int]) -> int:",
              callableName: "max_value",
              starterCode: "def max_value(nums):\n    return nums[0]\n",
            }
          : signature,
    ),
  },
  visible_tests: [
    {
      id: "visible-3",
      name: "finds maximum",
      arguments: [[3, 8, 2]],
      expected: 8,
      theme: "middle maximum",
      comparator: "deepEqual",
      visibility: "visible",
    },
  ],
};

const practiceProblems = [countPositiveProblem, maxValueProblem];

function decodeServerFunction(url: string) {
  const id = new URL(url).pathname.split("/_serverFn/")[1] ?? "";
  try {
    return JSON.parse(Buffer.from(id, "base64url").toString("utf8")) as {
      export?: string;
      file?: string;
    };
  } catch {
    return {};
  }
}

function serverFunctionResult(result: unknown) {
  return { result, context: {} };
}

async function installPracticeWorkspaceMocks(page: Page) {
  await page.route("**/auth/v1/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: fakeUser }),
    }),
  );

  await page.route("**/rest/v1/**", (route) => {
    const url = route.request().url();
    if (url.includes("/rpc/has_role")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: "false" });
    }

    if (url.includes("/profiles")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(null),
      });
    }

    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/_serverFn/**", (route) => {
    const meta = decodeServerFunction(route.request().url());
    const exportName = meta.export ?? "";

    if (exportName.includes("listPractice")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(serverFunctionResult({ problems: practiceProblems })),
      });
    }

    if (exportName.includes("runCode")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          serverFunctionResult({
            ok: true,
            stdout: "",
            stderr: "",
            exitCode: 0,
            compileStderr: "",
            testResults: [
              {
                id: "visible-1",
                name: "counts positives",
                visibility: "visible",
                passed: true,
                expected: 2,
                actual: 2,
              },
              {
                id: "visible-2",
                name: "empty list",
                visibility: "visible",
                passed: true,
                expected: 0,
                actual: 0,
              },
            ],
            testSummary: { total: 2, passed: 2, failed: 0, status: "passed" },
          }),
        ),
      });
    }

    if (exportName.includes("getUserConsent")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          serverFunctionResult({
            consent: {
              consent_given: true,
              consented_at: "2026-06-22T00:00:00.000Z",
              consent_version: "1.0",
            },
          }),
        ),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(serverFunctionResult({ ok: true })),
    });
  });

  await page.addInitScript(
    ({ projectRef, session }) => {
      localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
    },
    { projectRef: PROJECT_REF, session: fakeSession },
  );
}

async function openPracticeWorkspace(page: Page) {
  await installPracticeWorkspaceMocks(page);
  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "Practice" })).toBeVisible();
  await page.getByRole("button", { name: "Show all options" }).click();
  await expect(page.getByRole("button", { name: /Count Positive Numbers/ })).toBeVisible();
  await expect(page.locator(".cm-content").first()).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  expect(Math.max(metrics.documentScrollWidth, metrics.bodyScrollWidth)).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
}

test.describe("practice workspace", () => {
  test("supports desktop editor typing, visible tests, and problem navigation", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPracticeWorkspace(page);

    const editor = page.locator(".cm-content").first();
    await editor.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await page.keyboard.type(
      ["def count_positive(nums):", "    seen = 0", "    return seen"].join("\n"),
    );
    await expect(editor).toContainText("seen = 0");

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(editor).toContainText("TODO: count values greater than zero");

    await page.getByRole("button", { name: "Run tests" }).click();
    await expect(page.getByText("2/2 visible tests passed")).toBeVisible();
    await expect(page.getByText("counts positives").last()).toBeVisible();

    await page.getByRole("button", { name: /Find Maximum Value/ }).click();
    await expect(page.getByRole("heading", { name: "Find Maximum Value" })).toBeVisible();
    await expect(editor).toContainText("return nums[0]");

    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("practice-workspace-desktop.png"),
      fullPage: true,
    });
  });

  test("keeps the mobile workspace navigable without horizontal overflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPracticeWorkspace(page);

    await page.getByRole("button", { name: /Find Maximum Value/ }).click();
    await expect(page.getByRole("heading", { name: "Find Maximum Value" })).toBeVisible();
    await expect(page.locator(".cm-content").first()).toContainText("return nums[0]");
    await expect(page.getByRole("button", { name: "Run tests" })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("practice-workspace-mobile.png"),
      fullPage: true,
    });
  });
});
