import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import type { PracticeGenerationPlan } from "@/lib/practice-generation-plan.server";
import {
  PRACTICE_PROBLEM_CONTRACT_VERSION,
  PracticeProblemLanguageSignatureSchema,
  PracticeProblemLanguageSchema,
  StructuredPracticeProblemSchema,
  type PracticeProblemLanguage,
  type StructuredPracticeProblem,
} from "@/lib/practice-problem-contract";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstPresent(input: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in input && input[key] !== undefined && input[key] !== null) {
      return input[key];
    }
  }

  return undefined;
}

function stringArrayFromUnknown(value: unknown) {
  if (typeof value === "string") return [value];
  if (!Array.isArray(value)) return value;

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item)) {
        const text = firstPresent(item, ["body", "text", "criterion", "value", "description"]);
        return typeof text === "string" ? text : "";
      }
      return "";
    })
    .filter(Boolean);
}

function hasItems(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

function normalizeTagList(value: unknown) {
  if (!Array.isArray(value)) return value;

  return value.map((tag) => {
    if (typeof tag === "string") {
      const label = tag.trim();
      return {
        slug: label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        label,
      };
    }

    if (!isRecord(tag)) return tag;
    const label = firstPresent(tag, ["label", "name", "title", "slug"]);
    const slug = firstPresent(tag, ["slug", "id", "name", "label"]);
    return {
      ...tag,
      slug: typeof slug === "string" ? slug : tag.slug,
      label: typeof label === "string" ? label : tag.label,
    };
  });
}

function fallbackTagForGenerationPlan(generationPlan: PracticeGenerationPlan) {
  const slug = generationPlan.practicePlan.topicSlug ?? generationPlan.practicePlan.node.id;
  return {
    slug,
    label: generationPlan.practicePlan.node.title,
  };
}

function normalizeExampleList(value: unknown) {
  if (!Array.isArray(value)) return value;

  return value.map((example) => {
    if (!isRecord(example)) return example;

    const input = firstPresent(example, ["input", "arguments", "args", "inputArguments"]);
    const output = firstPresent(example, ["output", "expected", "expectedOutput"]);
    return {
      ...example,
      input: typeof input === "string" ? input : JSON.stringify(input),
      output: typeof output === "string" ? output : JSON.stringify(output),
    };
  });
}

function isValidCallableName(value: unknown) {
  return typeof value === "string" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());
}

function inferCallableNameFromStarterCode(
  language: unknown,
  starterCode: unknown,
): string | undefined {
  if (typeof language !== "string" || typeof starterCode !== "string") return undefined;

  const patterns: Record<string, RegExp[]> = {
    python: [/\bdef\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/],
    javascript: [/\b(?:export\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/],
    java: [
      /\b(?:public|private|protected|static|\s)+[\w<>]+(?:\[\])?\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/,
    ],
    cpp: [/(?:^|\n)\s*[\w:<>,*&\s]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/],
    go: [/\bfunc\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/],
  };

  for (const pattern of patterns[language] ?? []) {
    const match = starterCode.match(pattern);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

function normalizeCallableName(input: {
  callableName: unknown;
  language: unknown;
  starterCode: unknown;
  fallbackName: unknown;
}) {
  if (isValidCallableName(input.callableName)) return (input.callableName as string).trim();
  const inferred = inferCallableNameFromStarterCode(input.language, input.starterCode);
  if (inferred) return inferred;
  if (isValidCallableName(input.fallbackName)) return (input.fallbackName as string).trim();
  return input.callableName;
}

function splitSignatureParameters(value: string) {
  const parameters = value.match(/\(([^)]*)\)/)?.[1]?.trim();
  if (!parameters) return [];

  return parameters
    .split(",")
    .map((parameter) => parameter.trim())
    .filter(Boolean);
}

function normalizeParameterToken(language: unknown, value: string) {
  const token = value.replace(/=.*$/, "").trim();
  if (!token) return undefined;

  if (language === "python") {
    const [name, type] = token.split(":").map((part) => part.trim());
    if (isValidCallableName(name)) {
      return { name, type: type || "unknown" };
    }
  }

  if (language === "go") {
    const [name, type] = token.split(/\s+/);
    if (isValidCallableName(name)) {
      return { name, type: type || "unknown" };
    }
  }

  const parts = token.split(/\s+/).filter(Boolean);
  const name = parts.at(-1);
  const type = parts.length > 1 ? parts.slice(0, -1).join(" ") : "unknown";
  if (isValidCallableName(name)) {
    return { name, type };
  }

  return undefined;
}

function inferParametersFromSignature(language: unknown, value: unknown) {
  if (typeof value !== "string") return [];

  return splitSignatureParameters(value)
    .map((parameter) => normalizeParameterToken(language, parameter))
    .filter((parameter): parameter is { name: string; type: string } => Boolean(parameter));
}

function normalizeParameterList(value: unknown, language: unknown, signature: unknown) {
  const inferred = inferParametersFromSignature(language, signature);
  if (!Array.isArray(value)) return inferred.length ? inferred : value;

  const normalized = value
    .map((parameter) => {
      if (typeof parameter === "string") {
        return normalizeParameterToken(language, parameter);
      }

      if (!isRecord(parameter)) return undefined;
      const name = firstPresent(parameter, ["name", "param", "parameter", "identifier"]);
      const type = firstPresent(parameter, ["type", "dataType", "data_type", "annotation"]);
      const description = firstPresent(parameter, ["description", "desc", "details"]);
      if (!isValidCallableName(name)) return undefined;
      return {
        name: (name as string).trim(),
        type: typeof type === "string" && type.trim() ? type.trim() : "unknown",
        ...(typeof description === "string" && description.trim()
          ? { description: description.trim() }
          : {}),
      };
    })
    .filter((parameter): parameter is { name: string; type: string; description?: string } =>
      Boolean(parameter),
    );

  return normalized.length ? normalized : inferred.length ? inferred : value;
}

function inferReturnTypeFromSignature(language: unknown, value: unknown) {
  if (typeof value !== "string") return undefined;

  if (language === "python") {
    return value.match(/->\s*([^:]+)\s*:/)?.[1]?.trim();
  }

  if (language === "go") {
    return value.match(/\)\s*([^\s{]+)\s*(?:\{|$)/)?.[1]?.trim();
  }

  if (language === "java" || language === "cpp") {
    return value.match(/^\s*(.+?)\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/)?.[1]?.trim();
  }

  return undefined;
}

function normalizeLanguageSignatureList(
  value: unknown,
  selectedLanguage?: PracticeProblemLanguage,
) {
  const keepSupportedSignatures = (signatures: unknown) => {
    if (!selectedLanguage || !Array.isArray(signatures)) return signatures;

    const selectedCandidates = signatures.filter(
      (signature) => isRecord(signature) && signature.language === selectedLanguage,
    );
    const selectedSignature =
      selectedCandidates.find(
        (signature) => PracticeProblemLanguageSignatureSchema.safeParse(signature).success,
      ) ?? selectedCandidates[0];
    const seenLanguages = new Set<PracticeProblemLanguage>();
    const kept = selectedSignature ? [selectedSignature] : [];
    if (selectedSignature && isRecord(selectedSignature)) {
      seenLanguages.add(selectedLanguage);
    }

    for (const signature of signatures) {
      const parsed = PracticeProblemLanguageSignatureSchema.safeParse(signature);
      if (!parsed.success || parsed.data.language === selectedLanguage) continue;
      if (seenLanguages.has(parsed.data.language)) continue;
      seenLanguages.add(parsed.data.language);
      kept.push(parsed.data);
    }

    return kept;
  };

  const parentCallableName = isRecord(value)
    ? firstPresent(value, [
        "callableName",
        "callable_name",
        "functionName",
        "function_name",
        "name",
      ])
    : undefined;
  const signatureInput = isRecord(value)
    ? firstPresent(value, [
        "languageSignatures",
        "language_signatures",
        "signatures",
        "starterCodeByLanguage",
        "starter_code_by_language",
      ])
    : value;

  if (signatureInput === undefined && isRecord(value)) {
    const starterCode = firstPresent(value, ["starterCode", "starter_code", "code"]);
    const callableName = firstPresent(value, [
      "callableName",
      "callable_name",
      "functionName",
      "function_name",
      "name",
    ]);
    const signature = firstPresent(value, ["signature", "declaration"]);
    if (selectedLanguage && typeof starterCode === "string") {
      return keepSupportedSignatures([
        {
          language: selectedLanguage,
          callableName: normalizeCallableName({
            callableName,
            language: selectedLanguage,
            starterCode,
            fallbackName: parentCallableName,
          }),
          signature: typeof signature === "string" ? signature : starterCode.split("\n")[0],
          starterCode,
        },
      ]);
    }
  }

  if (Array.isArray(signatureInput)) {
    return keepSupportedSignatures(
      signatureInput.map((signature) => {
        if (!isRecord(signature)) return signature;
        const language =
          typeof signature.language === "string" ? signature.language : selectedLanguage;
        const starterCode = firstPresent(signature, ["starterCode", "starter_code", "code"]);
        return {
          ...signature,
          language,
          callableName: normalizeCallableName({
            callableName: firstPresent(signature, [
              "callableName",
              "callable_name",
              "functionName",
            ]),
            language,
            starterCode,
            fallbackName: language === selectedLanguage ? parentCallableName : undefined,
          }),
          starterCode,
        };
      }),
    );
  }

  if (!isRecord(signatureInput)) return signatureInput;

  return keepSupportedSignatures(
    Object.entries(signatureInput).map(([language, signature]) => {
      if (typeof signature === "string") {
        return {
          language,
          callableName: normalizeCallableName({
            callableName: parentCallableName,
            language,
            starterCode: signature,
            fallbackName: language === selectedLanguage ? parentCallableName : undefined,
          }),
          signature: signature,
          starterCode: signature,
        };
      }

      if (!isRecord(signature)) return signature;
      const starterCode = firstPresent(signature, ["starterCode", "starter_code", "code"]);
      const normalizedLanguage =
        typeof signature.language === "string" ? signature.language : language;
      return {
        ...signature,
        language: normalizedLanguage,
        callableName: normalizeCallableName({
          callableName:
            firstPresent(signature, ["callableName", "callable_name", "functionName"]) ??
            parentCallableName,
          language: normalizedLanguage,
          starterCode,
          fallbackName: normalizedLanguage === selectedLanguage ? parentCallableName : undefined,
        }),
        starterCode,
      };
    }),
  );
}

function normalizeFunctionSignature(value: unknown, selectedLanguage?: PracticeProblemLanguage) {
  if (!isRecord(value)) return value;

  const parameters = firstPresent(value, ["parameters", "params", "arguments", "args"]);
  const languageSignatures = normalizeLanguageSignatureList(value, selectedLanguage);
  const selectedSignature =
    Array.isArray(languageSignatures) && selectedLanguage
      ? languageSignatures.find(
          (signature) => isRecord(signature) && signature.language === selectedLanguage,
        )
      : undefined;
  const selectedStarterCode = isRecord(selectedSignature)
    ? firstPresent(selectedSignature, ["starterCode", "starter_code", "code"])
    : undefined;
  const selectedSignatureText = isRecord(selectedSignature)
    ? (firstPresent(selectedSignature, ["signature", "declaration"]) ?? selectedStarterCode)
    : undefined;
  const selectedCallableName = isRecord(selectedSignature)
    ? firstPresent(selectedSignature, ["callableName", "callable_name", "functionName"])
    : undefined;
  const returnType = firstPresent(value, ["returnType", "return_type", "returns"]);
  const inferredReturnType = inferReturnTypeFromSignature(selectedLanguage, selectedSignatureText);

  return {
    ...value,
    functionName: normalizeCallableName({
      callableName: firstPresent(value, ["functionName", "function_name", "name", "callableName"]),
      language: selectedLanguage,
      starterCode: selectedStarterCode,
      fallbackName: selectedCallableName,
    }),
    returnType:
      typeof returnType === "string" && returnType.trim()
        ? returnType
        : inferredReturnType || "unknown",
    parameters: normalizeParameterList(parameters, selectedLanguage, selectedSignatureText),
    languageSignatures,
  };
}

function normalizeTestCaseList(value: unknown, visibility: "visible" | "hidden") {
  if (!Array.isArray(value)) return value;

  return value.map((test, index) => {
    if (!isRecord(test)) return test;

    const args = firstPresent(test, ["arguments", "args", "inputArguments", "inputs", "input"]);
    const name = firstPresent(test, ["name", "title", "case"]);
    const theme = firstPresent(test, ["theme", "category", "scenario", "name", "title"]);

    return {
      ...test,
      name: typeof name === "string" ? name : `${visibility} case ${index + 1}`,
      arguments: Array.isArray(args) ? args : args === undefined ? test.arguments : [args],
      comparator:
        test.comparator === "numberTolerance" || test.comparator === "deepEqual"
          ? test.comparator
          : "deepEqual",
      expected: firstPresent(test, ["expected", "expectedOutput", "output"]),
      theme: typeof theme === "string" ? theme : `${visibility} case ${index + 1}`,
      visibility,
    };
  });
}

function normalizeHintList(value: unknown) {
  if (!Array.isArray(value)) return value;

  return value.map((hint, index) => {
    if (typeof hint === "string") {
      return {
        order: index + 1,
        title: `Hint ${index + 1}`,
        body: hint,
      };
    }

    if (!isRecord(hint)) return hint;
    const title = firstPresent(hint, ["title", "name", "label"]);
    const body = firstPresent(hint, ["body", "text", "hint", "description"]);
    return {
      ...hint,
      title: typeof title === "string" ? title : `Hint ${index + 1}`,
      body: typeof body === "string" ? body : "",
    };
  });
}

function fallbackExamplesFromVisibleTests(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .slice(0, 4)
    .map((test) => ({
      input: `arguments: ${JSON.stringify(test.arguments ?? [])}`,
      output: JSON.stringify(test.expected),
      explanation: "The expected output matches the visible test case.",
    }));
}

function fallbackConstraints() {
  return [
    "Use only the provided function arguments.",
    "Return the expected value without reading external input.",
  ];
}

function fallbackHints() {
  return [
    {
      order: 1,
      title: "Start with the function contract",
      body: "Use the parameters from the selected starter code and return the value described by the prompt.",
    },
  ];
}

function fallbackSuccessCriteria() {
  return [
    "Uses the selected function signature.",
    "Returns the expected value for visible and hidden tests.",
  ];
}

function canonicalizeGeneratedPracticeProblemInput(
  input: unknown,
  generationPlan: PracticeGenerationPlan,
  selectedLanguage?: PracticeProblemLanguage,
) {
  if (!isRecord(input)) return input;

  const functionSignature = normalizeFunctionSignature(
    firstPresent(input, ["functionSignature", "function_signature", "signature", "function"]),
    selectedLanguage,
  );
  const visibleTests = normalizeTestCaseList(
    firstPresent(input, ["visibleTests", "visible_tests", "sampleTests", "examplesAsTests"]),
    "visible",
  );
  const hiddenTests = normalizeTestCaseList(
    firstPresent(input, ["hiddenTests", "hidden_tests", "privateTests", "edgeTests"]),
    "hidden",
  );

  const canonical: Record<string, unknown> = {
    ...input,
    contractVersion: PRACTICE_PROBLEM_CONTRACT_VERSION,
    curriculumNodeId: generationPlan.practicePlan.node.id,
    masteryBand: generationPlan.practicePlan.masteryBand.id,
    objective: generationPlan.practicePlan.node.objective,
    title: firstPresent(input, ["title", "name", "problemTitle"]),
    topicTags: normalizeTagList(firstPresent(input, ["topicTags", "topic_tags", "tags"])),
    prerequisiteTags: normalizeTagList(
      firstPresent(input, ["prerequisiteTags", "prerequisite_tags", "prerequisites"]),
    ),
    statement: firstPresent(input, ["statement", "prompt", "description"]),
    examples: normalizeExampleList(firstPresent(input, ["examples", "sampleExamples"])),
    constraints: stringArrayFromUnknown(firstPresent(input, ["constraints", "limits"])),
    functionSignature,
    visibleTests,
    hiddenTests,
    hintLadder: normalizeHintList(firstPresent(input, ["hintLadder", "hint_ladder", "hints"])),
    successCriteria: stringArrayFromUnknown(
      firstPresent(input, ["successCriteria", "success_criteria", "criteria"]),
    ),
  };

  if (!Array.isArray(canonical.topicTags) || canonical.topicTags.length === 0) {
    canonical.topicTags = [fallbackTagForGenerationPlan(generationPlan)];
  }

  if (!hasItems(canonical.prerequisiteTags)) {
    canonical.prerequisiteTags = [];
  }

  if (!hasItems(canonical.examples)) {
    canonical.examples = fallbackExamplesFromVisibleTests(canonical.visibleTests);
  }

  if (!hasItems(canonical.constraints)) {
    canonical.constraints = fallbackConstraints();
  }

  if (!hasItems(canonical.hintLadder)) {
    canonical.hintLadder = fallbackHints();
  }

  if (!hasItems(canonical.successCriteria)) {
    canonical.successCriteria = fallbackSuccessCriteria();
  }

  if (Array.isArray(canonical.hiddenTests)) {
    const themes = canonical.hiddenTests
      .map((test) => (isRecord(test) && typeof test.theme === "string" ? test.theme.trim() : ""))
      .filter(Boolean);
    canonical.hiddenTestThemes = [...new Set(themes)];
  }

  if (Array.isArray(canonical.hintLadder)) {
    canonical.hintLadder = canonical.hintLadder
      .filter(isRecord)
      .sort((left, right) => {
        const leftOrder = typeof left.order === "number" ? left.order : Number.MAX_SAFE_INTEGER;
        const rightOrder = typeof right.order === "number" ? right.order : Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder;
      })
      .map((hint, index) => ({
        ...hint,
        order: index + 1,
      }));
  }

  return canonical;
}

export function buildStructuredPracticeProblemSchema(
  generationPlan: PracticeGenerationPlan,
  options: { language?: PracticeProblemLanguage } = {},
) {
  const language = options.language
    ? PracticeProblemLanguageSchema.parse(options.language)
    : undefined;

  return z
    .preprocess(
      (input) => canonicalizeGeneratedPracticeProblemInput(input, generationPlan, language),
      StructuredPracticeProblemSchema,
    )
    .superRefine((problem, ctx) => {
      if (problem.curriculumNodeId !== generationPlan.practicePlan.node.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["curriculumNodeId"],
          message: `Expected curriculum node ${generationPlan.practicePlan.node.id}.`,
        });
      }

      if (problem.masteryBand !== generationPlan.practicePlan.masteryBand.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["masteryBand"],
          message: `Expected mastery band ${generationPlan.practicePlan.masteryBand.id}.`,
        });
      }

      if (problem.objective !== generationPlan.practicePlan.node.objective) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["objective"],
          message: "Objective must match the selected curriculum node.",
        });
      }

      if (language) {
        const languageSignature = problem.functionSignature.languageSignatures.find(
          (signature) => signature.language === language,
        );
        if (!languageSignature) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["functionSignature", "languageSignatures"],
            message: `Missing ${language} function signature.`,
          });
        }
      }
    });
}

export function getStructuredStarterCode(
  problem: StructuredPracticeProblem,
  language: PracticeProblemLanguage,
) {
  return (
    problem.functionSignature.languageSignatures.find((item) => item.language === language)
      ?.starterCode ?? ""
  );
}

export function getStructuredCallableName(
  problem: StructuredPracticeProblem,
  language: PracticeProblemLanguage,
) {
  return (
    problem.functionSignature.languageSignatures.find((item) => item.language === language)
      ?.callableName ?? problem.functionSignature.functionName
  );
}

export function formatStructuredPracticePrompt(problem: StructuredPracticeProblem) {
  const examples = problem.examples
    .map((example, index) =>
      [
        `Example ${index + 1}`,
        `Input: ${example.input}`,
        `Output: ${example.output}`,
        example.explanation ? `Explanation: ${example.explanation}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  return [
    `Objective: ${problem.objective}`,
    "",
    problem.statement,
    "",
    "Examples",
    examples,
    "",
    "Constraints",
    ...problem.constraints.map((constraint) => `- ${constraint}`),
    "",
    "Expected function signature",
    `${problem.functionSignature.functionName}(${problem.functionSignature.parameters
      .map((parameter) => `${parameter.name}: ${parameter.type}`)
      .join(", ")}) -> ${problem.functionSignature.returnType}`,
    "",
    "Language callable names",
    ...problem.functionSignature.languageSignatures.map(
      (item) => `- ${item.language}: ${item.callableName}`,
    ),
    "",
    "Visible tests",
    ...problem.visibleTests.map(
      (test) =>
        `- ${test.name}: arguments ${JSON.stringify(test.arguments)}, expected ${JSON.stringify(test.expected)}`,
    ),
    "",
    "Hidden-test themes",
    ...problem.hiddenTestThemes.map((theme) => `- ${theme}`),
    "",
    "Hints",
    ...problem.hintLadder
      .sort((a, b) => a.order - b.order)
      .map((hint) => `${hint.order}. ${hint.title}: ${hint.body}`),
    "",
    "Success criteria",
    ...problem.successCriteria.map((criterion) => `- ${criterion}`),
  ].join("\n");
}

export function buildStructuredPracticeProblemInsert(input: {
  userId: string;
  language: PracticeProblemLanguage;
  generationPlan: PracticeGenerationPlan;
  problem: StructuredPracticeProblem;
}) {
  const { generationPlan, problem } = input;

  return {
    user_id: input.userId,
    topic_slug: generationPlan.problemInsertPlan.topic_slug,
    contract_version: problem.contractVersion,
    curriculum_node_id: problem.curriculumNodeId,
    mastery_band: problem.masteryBand,
    objective: problem.objective,
    title: problem.title,
    prompt: formatStructuredPracticePrompt(problem),
    starter_code: getStructuredStarterCode(problem, input.language),
    language: input.language,
    planning_context: generationPlan.problemInsertPlan.planning_context as Json,
    statement: problem.statement,
    topic_tags: problem.topicTags as Json,
    prerequisite_tags: problem.prerequisiteTags as Json,
    examples: problem.examples as Json,
    constraints: problem.constraints as Json,
    function_signature: problem.functionSignature as Json,
    visible_tests: problem.visibleTests as Json,
    hidden_test_themes: problem.hiddenTestThemes as Json,
    hint_ladder: problem.hintLadder as Json,
    success_criteria: problem.successCriteria as Json,
    generation_status: "structured",
  };
}

export function buildStructuredPracticeHiddenTestsInsert(input: {
  userId: string;
  practiceProblemId: string;
  problem: StructuredPracticeProblem;
}) {
  return {
    user_id: input.userId,
    practice_problem_id: input.practiceProblemId,
    hidden_tests: input.problem.hiddenTests as Json,
  };
}
