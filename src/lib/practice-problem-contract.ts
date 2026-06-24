import { z } from "zod";
import type { MasteryBandId } from "@/lib/dsa-curriculum";

export const PRACTICE_PROBLEM_CONTRACT_VERSION = "codewise-dsa-problem.v1" as const;

export const PracticeProblemMasteryBandSchema = z.enum([
  "0-20",
  "21-40",
  "41-60",
  "61-80",
  "81-100",
]);

export const PracticeProblemLanguageSchema = z.enum(["python", "javascript", "java", "cpp", "go"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLanguageSignaturesInput(value: unknown) {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return value;

  return Object.entries(value).map(([language, signature]) => {
    if (!isRecord(signature)) return signature;
    return {
      ...signature,
      language: typeof signature.language === "string" ? signature.language : language,
    };
  });
}

function normalizePracticeTestCaseInput(value: unknown) {
  if (!isRecord(value)) return value;

  const normalized: Record<string, unknown> = { ...value };
  if (!("expected" in normalized) && "expectedOutput" in normalized) {
    normalized.expected = normalized.expectedOutput;
  }
  if (!("arguments" in normalized) && Array.isArray(normalized.args)) {
    normalized.arguments = normalized.args;
  }
  if (!("arguments" in normalized) && Array.isArray(normalized.inputArguments)) {
    normalized.arguments = normalized.inputArguments;
  }
  return normalized;
}

export const PracticeProblemTagSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
});

export const PracticeProblemExampleSchema = z.object({
  input: z.string().trim().min(1).max(1000),
  output: z.string().trim().min(1).max(1000),
  explanation: z.string().trim().min(1).max(1200).optional(),
});

export const PracticeProblemParameterSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(240).optional(),
});

export const PracticeProblemLanguageSignatureSchema = z.object({
  language: PracticeProblemLanguageSchema,
  callableName: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Callable name must be a valid identifier."),
  signature: z.string().trim().min(1).max(500),
  starterCode: z.string().trim().min(1).max(5000),
});

export const PracticeProblemFunctionSignatureSchema = z.object({
  functionName: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Function name must be a valid identifier."),
  parameters: z.array(PracticeProblemParameterSchema).min(1).max(6),
  returnType: z.string().trim().min(1).max(120),
  languageSignatures: z.preprocess(
    normalizeLanguageSignaturesInput,
    z.array(PracticeProblemLanguageSignatureSchema).min(1).max(5),
  ),
});

export type PracticeProblemTestValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | boolean[];

export const PracticeProblemTestValueSchema: z.ZodType<PracticeProblemTestValue> = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.array(z.number().finite()),
  z.array(z.boolean()),
]);

const PracticeProblemTestCaseObjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  arguments: z.array(PracticeProblemTestValueSchema).max(8),
  expected: PracticeProblemTestValueSchema,
  theme: z.string().trim().min(1).max(160),
  comparator: z.enum(["deepEqual", "numberTolerance"]).default("deepEqual"),
  visibility: z.enum(["visible", "hidden"]),
});

export const PracticeProblemTestCaseSchema = PracticeProblemTestCaseObjectSchema;

export const PracticeProblemHintSchema = z.object({
  order: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(800),
});

export const StructuredPracticeProblemSchema = z
  .object({
    contractVersion: z.literal(PRACTICE_PROBLEM_CONTRACT_VERSION),
    curriculumNodeId: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(120),
    topicTags: z.array(PracticeProblemTagSchema).min(1).max(6),
    prerequisiteTags: z.array(PracticeProblemTagSchema).max(8).default([]),
    masteryBand: PracticeProblemMasteryBandSchema,
    objective: z.string().trim().min(1).max(500),
    statement: z.string().trim().min(1).max(2000),
    examples: z.array(PracticeProblemExampleSchema).min(1).max(4),
    constraints: z.array(z.string().trim().min(1).max(240)).min(1).max(8),
    functionSignature: PracticeProblemFunctionSignatureSchema,
    visibleTests: z
      .array(
        z.preprocess(
          normalizePracticeTestCaseInput,
          PracticeProblemTestCaseObjectSchema.extend({ visibility: z.literal("visible") }),
        ),
      )
      .min(1)
      .max(6),
    hiddenTests: z
      .array(
        z.preprocess(
          normalizePracticeTestCaseInput,
          PracticeProblemTestCaseObjectSchema.extend({ visibility: z.literal("hidden") }),
        ),
      )
      .min(1)
      .max(8),
    hiddenTestThemes: z.array(z.string().trim().min(1).max(160)).min(1).max(8),
    hintLadder: z.array(PracticeProblemHintSchema).min(1).max(5),
    successCriteria: z.array(z.string().trim().min(1).max(240)).min(1).max(8),
  })
  .strict()
  .superRefine((problem, ctx) => {
    const signatureLanguages = new Set(
      problem.functionSignature.languageSignatures.map((item) => item.language),
    );

    if (signatureLanguages.size !== problem.functionSignature.languageSignatures.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["functionSignature", "languageSignatures"],
        message: "Language signatures must include each language once.",
      });
    }

    for (const language of PracticeProblemLanguageSchema.options) {
      if (!signatureLanguages.has(language)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["functionSignature", "languageSignatures"],
          message: `Missing ${language} function signature.`,
        });
      }
    }

    const hiddenThemes = new Set(problem.hiddenTests.map((test) => test.theme));
    for (const theme of problem.hiddenTestThemes) {
      if (!hiddenThemes.has(theme)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hiddenTestThemes"],
          message: `Hidden-test theme has no matching hidden test: ${theme}.`,
        });
      }
    }

    const hintOrders = problem.hintLadder.map((hint) => hint.order);
    const uniqueHintOrders = new Set(hintOrders);
    if (uniqueHintOrders.size !== hintOrders.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hintLadder"],
        message: "Hint order values must be unique.",
      });
    }

    const sortedHintOrders = [...hintOrders].sort((a, b) => a - b);
    if (sortedHintOrders.some((order, index) => order !== index + 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hintLadder"],
        message: "Hint order values must start at 1 and have no gaps.",
      });
    }
  });

export type PracticeProblemMasteryBand = z.infer<typeof PracticeProblemMasteryBandSchema>;
export type PracticeProblemLanguage = z.infer<typeof PracticeProblemLanguageSchema>;
export type PracticeProblemTag = z.infer<typeof PracticeProblemTagSchema>;
export type PracticeProblemExample = z.infer<typeof PracticeProblemExampleSchema>;
export type PracticeProblemParameter = z.infer<typeof PracticeProblemParameterSchema>;
export type PracticeProblemLanguageSignature = z.infer<
  typeof PracticeProblemLanguageSignatureSchema
>;
export type PracticeProblemFunctionSignature = z.infer<
  typeof PracticeProblemFunctionSignatureSchema
>;
export type PracticeProblemTestCase = z.infer<typeof PracticeProblemTestCaseSchema>;
export type PracticeProblemHint = z.infer<typeof PracticeProblemHintSchema>;
export type StructuredPracticeProblem = z.infer<typeof StructuredPracticeProblemSchema>;

export interface StructuredPracticeProblemValidationResult {
  ok: boolean;
  problem?: StructuredPracticeProblem;
  issues: string[];
}

export function buildStructuredPracticeProblemContractInstructions() {
  return [
    "Nested JSON shape:",
    "functionSignature.languageSignatures must be an array with one object for each language: python, javascript, java, cpp, and go.",
    "Each language signature object must use language, callableName, signature, and starterCode.",
    "visibleTests and hiddenTests must be arrays of objects with name, arguments, expected, theme, comparator, and visibility.",
    "Use arguments as an array of function arguments. Use expected for the expected return value.",
    'Use visibility: "visible" for visibleTests and visibility: "hidden" for hiddenTests.',
    "hiddenTestThemes must exactly match theme values from hiddenTests.",
  ].join(" ");
}

export function parseStructuredPracticeProblem(input: unknown): StructuredPracticeProblem {
  return StructuredPracticeProblemSchema.parse(input);
}

export function validateStructuredPracticeProblem(
  input: unknown,
): StructuredPracticeProblemValidationResult {
  const result = StructuredPracticeProblemSchema.safeParse(input);
  if (result.success) {
    return {
      ok: true,
      problem: result.data,
      issues: [],
    };
  }

  return {
    ok: false,
    issues: result.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "problem";
      return `${path}: ${issue.message}`;
    }),
  };
}

export function isPracticeProblemMasteryBand(value: string): value is MasteryBandId {
  return PracticeProblemMasteryBandSchema.safeParse(value).success;
}
