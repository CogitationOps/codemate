import { PlannerOutput, parsePlannerOutput } from "@/backend/types";
import { generateStructuredOrFallback } from "@/backend/services/llm";

function heuristicIntent(query: string): PlannerOutput["intent"] {
  const q = query.toLowerCase();
  if (q.includes("bug") || q.includes("error") || q.includes("broken") || q.includes("fix")) {
    return "bug_search";
  }
  if (q.includes("refactor") || q.includes("cleanup") || q.includes("improve structure")) {
    return "refactor";
  }
  if (q.includes("feature") || q.includes("add") || q.includes("implement")) {
    return "feature_search";
  }
  return "explain";
}

function heuristicKeywords(query: string): string[] {
  const stop = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "for",
    "in",
    "on",
    "of",
    "with",
    "please",
    "can",
    "you",
    "this",
    "that",
  ]);

  const parts = query
    .toLowerCase()
    .split(/[^a-z0-9_./-]+/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 2 && !stop.has(p));

  return Array.from(new Set(parts)).slice(0, 10);
}

export async function runPlannerAgent(query: string): Promise<PlannerOutput> {
  const fallback: PlannerOutput = {
    intent: heuristicIntent(query),
    keywords: heuristicKeywords(query).length > 0 ? heuristicKeywords(query) : ["bug", "error"],
  };

  return generateStructuredOrFallback<PlannerOutput>({
    system:
      "You are a planner for a repo analysis system. Return strict JSON only. Keep keywords compact and useful for code search.",
    prompt: "User query: " + query,
    fallback,
    parser: parsePlannerOutput,
  });
}
