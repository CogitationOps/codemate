import { AnalyzerOutput, ContextOutput, parseAnalyzerOutput } from "@/backend/types";
import { generateStructuredOrFallback } from "@/backend/services/llm";

function heuristicAnalyzer(query: string, context: ContextOutput): AnalyzerOutput {
  const topFiles = context.relevantFiles.slice(0, 3).map((f) => f.path);
  return {
    issues: [
      {
        title: "Potential issue scope identified",
        description:
          "Query indicates likely problem around: " +
          topFiles.join(", ") +
          ". Validate runtime paths and error handling in these files.",
        severity: "medium",
      },
    ],
    todos: [
      { text: "Reproduce the bug with a deterministic test case", priority: 1 },
      { text: "Patch the failing path in " + (topFiles[0] ?? "the primary file"), priority: 2 },
      { text: "Add regression coverage for the patched behavior", priority: 2 },
    ],
  };
}

function compactContext(context: ContextOutput): string {
  return context.relevantFiles
    .map((f) => "FILE: " + f.path + "\nREASON: " + f.reason + "\nCONTENT:\n" + f.content.slice(0, 1500))
    .join("\n\n---\n\n");
}

export async function runAnalyzerAgent(params: {
  query: string;
  context: ContextOutput;
}): Promise<AnalyzerOutput> {
  const fallback = heuristicAnalyzer(params.query, params.context);

  return generateStructuredOrFallback<AnalyzerOutput>({
    system:
      "You are a strict code analysis agent. Return JSON only with actionable issues and todos. Be concise and technical.",
    prompt:
      "User query:\n" +
      params.query +
      "\n\nContext (limited files):\n" +
      compactContext(params.context) +
      "\n\nGenerate issues and TODOs. Prioritize likely defects and fixes.",
    fallback,
    parser: parseAnalyzerOutput,
  });
}
