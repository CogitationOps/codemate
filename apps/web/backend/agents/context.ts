import { ContextOutput, RepoRef, SearchOutput, parseContextOutput } from "@/backend/types";
import { getFileContent, listRepositoryFiles } from "@/backend/services/github";

const IMPORT_RE = /(?:import|export)\s+(?:type\s+)?(?:[^"'`]+?\s+from\s+)?["']([^"']+)["']/g;

function normalizePosixPath(input: string): string {
  const isAbsolute = input.startsWith("/");
  const parts = input.split("/");
  const stack: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      if (stack.length > 0) {
        stack.pop();
      }
      continue;
    }
    stack.push(part);
  }

  const normalized = stack.join("/");
  return isAbsolute ? "/" + normalized : normalized;
}

function dirnamePosix(filePath: string): string {
  const normalized = normalizePosixPath(filePath);
  const idx = normalized.lastIndexOf("/");
  if (idx <= 0) {
    return ".";
  }
  return normalized.slice(0, idx);
}

function joinPosix(base: string, next: string): string {
  return normalizePosixPath(base.replace(/\/+$/, "") + "/" + next.replace(/^\/+/, ""));
}

function resolveCandidatePaths(fromPath: string, importPath: string): string[] {
  const dir = dirnamePosix(fromPath);
  const base = joinPosix(dir, importPath);
  const candidates = [
    base,
    base + ".ts",
    base + ".tsx",
    base + ".js",
    base + ".jsx",
    joinPosix(base, "index.ts"),
    joinPosix(base, "index.tsx"),
    joinPosix(base, "index.js"),
  ];
  return Array.from(new Set(candidates));
}

function extractRelativeImports(fileContent: string): string[] {
  const imports: string[] = [];
  IMPORT_RE.lastIndex = 0;
  let match: RegExpExecArray | null = IMPORT_RE.exec(fileContent);
  while (match) {
    const value = match[1];
    if (value.startsWith(".")) {
      imports.push(value);
    }
    match = IMPORT_RE.exec(fileContent);
  }
  return imports;
}

export async function runContextBuilder(params: {
  repo: RepoRef;
  repoVersion: string;
  search: SearchOutput;
  limit?: number;
}): Promise<ContextOutput> {
  const limit = params.limit ?? 8;
  const pathsInTree = new Set((await listRepositoryFiles(params.repo, params.repoVersion)).map((f) => f.path));

  const selected = params.search.files.slice(0, limit);
  const relevantFiles: ContextOutput["relevantFiles"] = [];
  const seen = new Set<string>();

  for (const file of selected) {
    const content = await getFileContent(params.repo, file.path, params.repoVersion);
    if (!content || seen.has(file.path)) {
      continue;
    }
    seen.add(file.path);
    relevantFiles.push({
      path: file.path,
      content: content.slice(0, 6000),
      reason: "Primary search hit for user query",
    });
  }

  for (const current of [...relevantFiles]) {
    if (relevantFiles.length >= limit) {
      break;
    }

    const imports = extractRelativeImports(current.content);
    for (const relImport of imports) {
      if (relevantFiles.length >= limit) {
        break;
      }
      const candidates = resolveCandidatePaths(current.path, relImport);
      const found = candidates.find((candidate) => pathsInTree.has(candidate) && !seen.has(candidate));
      if (!found) {
        continue;
      }

      const importContent = await getFileContent(params.repo, found, params.repoVersion);
      if (!importContent) {
        continue;
      }

      seen.add(found);
      relevantFiles.push({
        path: found,
        content: importContent.slice(0, 6000),
        reason: "Dependency expansion from " + current.path,
      });
    }
  }

  const parsed = parseContextOutput({ relevantFiles: relevantFiles.slice(0, limit) });
  return parsed ?? { relevantFiles: [] };
}
