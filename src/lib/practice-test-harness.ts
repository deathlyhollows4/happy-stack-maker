import { z } from "zod";
import {
  PracticeProblemTestValueSchema,
  type PracticeProblemTestCase,
  type PracticeProblemTestValue,
} from "@/lib/practice-problem-contract";

export const PRACTICE_TEST_CASE_TIMEOUT_MS = {
  min: 100,
  default: 3_000,
  max: 10_000,
} as const;

export const PracticeTestVisibilitySchema = z.enum(["visible", "hidden"]);

export const PracticeTestComparatorSchema = z.enum(["deepEqual", "numberTolerance"]);

export const PracticeTestInputSchema = z
  .object({
    arguments: z.array(PracticeProblemTestValueSchema).max(8).default([]),
    stdin: z.string().max(10_000).optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    if (input.arguments.length === 0 && typeof input.stdin !== "string") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["arguments"],
        message: "A test case needs function arguments or stdin input.",
      });
    }
  });

export const PracticeHarnessTestCaseSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9][a-z0-9-]*$/, "Use a lowercase kebab-case test id."),
    name: z.string().trim().min(1).max(120),
    input: PracticeTestInputSchema,
    expectedOutput: PracticeProblemTestValueSchema,
    comparator: PracticeTestComparatorSchema.default("deepEqual"),
    timeoutMs: z
      .number()
      .int()
      .min(PRACTICE_TEST_CASE_TIMEOUT_MS.min)
      .max(PRACTICE_TEST_CASE_TIMEOUT_MS.max)
      .default(PRACTICE_TEST_CASE_TIMEOUT_MS.default),
    visibility: PracticeTestVisibilitySchema,
  })
  .strict();

export const PracticeHarnessTestCaseListSchema = z.array(PracticeHarnessTestCaseSchema).min(1);

export type PracticeTestVisibility = z.infer<typeof PracticeTestVisibilitySchema>;
export type PracticeTestComparator = z.infer<typeof PracticeTestComparatorSchema>;
export type PracticeTestInput = z.infer<typeof PracticeTestInputSchema>;
export type PracticeHarnessTestCase = z.infer<typeof PracticeHarnessTestCaseSchema>;

export interface PracticeHarnessValidationResult {
  ok: boolean;
  testCases?: PracticeHarnessTestCase[];
  issues: string[];
}

export interface NormalizePracticeProblemTestCaseOptions {
  index: number;
  timeoutMs?: number;
}

function toTestCaseId(name: string, visibility: PracticeTestVisibility, index: number): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${visibility}-${index + 1}-${slug || "case"}`;
}

export function normalizePracticeProblemTestCase(
  testCase: PracticeProblemTestCase,
  options: NormalizePracticeProblemTestCaseOptions,
): PracticeHarnessTestCase {
  return PracticeHarnessTestCaseSchema.parse({
    id: toTestCaseId(testCase.name, testCase.visibility, options.index),
    name: testCase.name,
    input: {
      arguments: testCase.arguments,
    },
    expectedOutput: testCase.expected,
    comparator: testCase.comparator,
    timeoutMs: options.timeoutMs ?? PRACTICE_TEST_CASE_TIMEOUT_MS.default,
    visibility: testCase.visibility,
  });
}

export function normalizePracticeProblemTestCases(
  testCases: PracticeProblemTestCase[],
  timeoutMs = PRACTICE_TEST_CASE_TIMEOUT_MS.default,
): PracticeHarnessTestCase[] {
  return PracticeHarnessTestCaseListSchema.parse(
    testCases.map((testCase, index) =>
      normalizePracticeProblemTestCase(testCase, {
        index,
        timeoutMs,
      }),
    ),
  );
}

export function parsePracticeHarnessTestCases(input: unknown): PracticeHarnessTestCase[] {
  return PracticeHarnessTestCaseListSchema.parse(input);
}

export function validatePracticeHarnessTestCases(input: unknown): PracticeHarnessValidationResult {
  const result = PracticeHarnessTestCaseListSchema.safeParse(input);
  if (result.success) {
    return {
      ok: true,
      testCases: result.data,
      issues: [],
    };
  }

  return {
    ok: false,
    issues: result.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "testCases";
      return `${path}: ${issue.message}`;
    }),
  };
}

export function isPracticeTestValue(value: unknown): value is PracticeProblemTestValue {
  return PracticeProblemTestValueSchema.safeParse(value).success;
}
