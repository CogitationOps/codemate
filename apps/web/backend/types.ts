export const INTENTS = ["bug_search", "feature_search", "refactor", "explain"] as const;
export type Intent = (typeof INTENTS)[number];

export type Workspace = {
  id: string;
  name: string;
  repoUrl: string;
  repoId: string;
  currentVersion: string; // Latest Commit SHA
  status: "indexing" | "ready" | "error";
  createdAt: number;
};

export type CodeChunk = {
  id: string;
  workspaceId: string;
  version: string;
  filePath: string;
  content: string;
  embedding?: number[];
};

export type CommitInsight = {
  workspaceId: string;
  commitId: string;
  risk: "low" | "medium" | "high";
  summary: string;
};

export type PlannerOutput = {
  intent: Intent;
  keywords: string[];
  fileHints?: string[];
};

export type SearchOutput = {
  files: Array<{
    path: string;
    snippet: string;
  }>;
};

export type ContextOutput = {
  relevantFiles: Array<{
    path: string;
    content: string;
    reason: string;
  }>;
};

export type AnalyzerOutput = {
  issues: Array<{
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  todos: Array<{
    text: string;
    priority: number;
  }>;
};

export type AnalyzeRequest = {
  workspaceId?: string;
  repo: string;
  query: string;
  branch?: string;
  contextLimit: number;
  searchLimit: number;
};

export type RepoRef = {
  owner: string;
  repo: string;
  branch?: string;
};

export type SearchHit = {
  path: string;
  snippet: string;
  score: number;
  source: "grep" | "vector";
};

const SEVERITIES = ["low", "medium", "high", "critical"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asStringArray(value: unknown, maxLength: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, maxLength);
}

export function parseAnalyzeRequest(value: unknown): AnalyzeRequest {
  if (!isObject(value)) {
    throw new Error("Invalid request payload.");
  }

  const repo = typeof value.repo === "string" ? value.repo.trim() : "";
  const query = typeof value.query === "string" ? value.query.trim() : "";
  const branch = typeof value.branch === "string" ? value.branch.trim() : undefined;
  const contextLimit =
    typeof value.contextLimit === "number" && Number.isInteger(value.contextLimit)
      ? Math.min(10, Math.max(3, value.contextLimit))
      : 8;
  const searchLimit =
    typeof value.searchLimit === "number" && Number.isInteger(value.searchLimit)
      ? Math.min(30, Math.max(5, value.searchLimit))
      : 12;

  if (repo.length === 0) {
    throw new Error("`repo` is required.");
  }
  if (query.length < 3) {
    throw new Error("`query` must be at least 3 characters.");
  }

  return { repo, query, branch, contextLimit, searchLimit };
}

export function parsePlannerOutput(value: unknown): PlannerOutput | null {
  if (!isObject(value)) {
    return null;
  }

  const intent = typeof value.intent === "string" ? (value.intent as Intent) : null;
  if (!intent || !INTENTS.includes(intent)) {
    return null;
  }

  const keywords = asStringArray(value.keywords, 12);
  if (keywords.length === 0) {
    return null;
  }

  const fileHints = asStringArray(value.fileHints, 10);
  return {
    intent,
    keywords,
    fileHints: fileHints.length > 0 ? fileHints : undefined,
  };
}

export function parseSearchOutput(value: unknown): SearchOutput | null {
  if (!isObject(value) || !Array.isArray(value.files)) {
    return null;
  }

  const files = value.files
    .map((item) => {
      if (!isObject(item) || typeof item.path !== "string" || typeof item.snippet !== "string") {
        return null;
      }
      const path = item.path.trim();
      const snippet = item.snippet.trim();
      if (path.length === 0 || snippet.length === 0) {
        return null;
      }
      return { path, snippet };
    })
    .filter((item): item is { path: string; snippet: string } => item !== null)
    .slice(0, 25);

  return { files };
}

export function parseContextOutput(value: unknown): ContextOutput | null {
  if (!isObject(value) || !Array.isArray(value.relevantFiles)) {
    return null;
  }

  const relevantFiles = value.relevantFiles
    .map((item) => {
      if (
        !isObject(item) ||
        typeof item.path !== "string" ||
        typeof item.content !== "string" ||
        typeof item.reason !== "string"
      ) {
        return null;
      }
      const path = item.path.trim();
      const content = item.content.trim();
      const reason = item.reason.trim();
      if (path.length === 0 || content.length === 0 || reason.length === 0) {
        return null;
      }
      return { path, content, reason };
    })
    .filter((item): item is { path: string; content: string; reason: string } => item !== null)
    .slice(0, 10);

  return { relevantFiles };
}

export function parseAnalyzerOutput(value: unknown): AnalyzerOutput | null {
  if (!isObject(value) || !Array.isArray(value.issues) || !Array.isArray(value.todos)) {
    return null;
  }

  const issues = value.issues
    .map((item) => {
      if (
        !isObject(item) ||
        typeof item.title !== "string" ||
        typeof item.description !== "string" ||
        typeof item.severity !== "string"
      ) {
        return null;
      }
      if (!SEVERITIES.includes(item.severity as (typeof SEVERITIES)[number])) {
        return null;
      }
      const title = item.title.trim();
      const description = item.description.trim();
      if (title.length === 0 || description.length === 0) {
        return null;
      }
      return {
        title,
        description,
        severity: item.severity as AnalyzerOutput["issues"][number]["severity"],
      };
    })
    .filter((item): item is AnalyzerOutput["issues"][number] => item !== null)
    .slice(0, 10);

  const todos = value.todos
    .map((item) => {
      if (!isObject(item) || typeof item.text !== "string" || typeof item.priority !== "number") {
        return null;
      }
      const text = item.text.trim();
      const priority = Number.isInteger(item.priority) ? item.priority : Math.round(item.priority);
      if (text.length === 0 || priority < 1 || priority > 5) {
        return null;
      }
      return { text, priority };
    })
    .filter((item): item is AnalyzerOutput["todos"][number] => item !== null)
    .slice(0, 15);

  if (issues.length === 0 && todos.length === 0) {
    return null;
  }

  return { issues, todos };
}
