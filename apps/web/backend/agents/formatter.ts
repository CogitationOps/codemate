import { AnalyzerOutput, ContextOutput, PlannerOutput, SearchOutput } from "@/backend/types";

export type FormattedResponse = {
  summary: string[];
  issues: Array<{ severity: string; title: string; description: string }>;
  todos: Array<{ priority: number; text: string }>;
  contextFiles: Array<{ path: string; reason: string }>;
};

export function formatAgentResponse(params: {
  query: string;
  planner: PlannerOutput;
  search: SearchOutput;
  context: ContextOutput;
  analysis: AnalyzerOutput;
}): FormattedResponse {
  const summary = [
    "Intent: " + params.planner.intent,
    "Keywords: " + params.planner.keywords.join(", "),
    "Search hits: " + String(params.search.files.length),
    "Context files: " + String(params.context.relevantFiles.length),
  ];

  return {
    summary,
    issues: params.analysis.issues.map((issue) => ({
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
    })),
    todos: [...params.analysis.todos].sort((a, b) => a.priority - b.priority),
    contextFiles: params.context.relevantFiles.map((file) => ({
      path: file.path,
      reason: file.reason,
    })),
  };
}
