import { RepoRef, SearchHit } from "../types";
import { getFileContent, listRepositoryFiles } from "./github";

const MAX_FILE_BYTES = 250_000;
const MAX_FILES_SCANNED = 250;

const TEXT_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "json",
  "md",
  "py",
  "go",
  "rs",
  "java",
  "kt",
  "rb",
  "php",
  "yml",
  "yaml",
  "toml",
  "sh",
  "sql",
  "css",
  "scss",
  "html",
]);

const IGNORE_SEGMENTS = [
  "node_modules/",
  "dist/",
  "build/",
  ".next/",
  "coverage/",
  ".git/",
  "vendor/",
  "out/",
  "target/",
  "__pycache__/",
];

export function shouldIndexPath(path: string): boolean {
  if (IGNORE_SEGMENTS.some((segment) => path.includes(segment))) {
    return false;
  }

  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) {
    return false;
  }

  return TEXT_EXTENSIONS.has(ext);
}

export function extractSnippet(content: string, keywords: string[], maxLength = 280): string {
  const lower = content.toLowerCase();
  const needle = keywords
    .map((kw) => kw.toLowerCase())
    .find((kw) => kw.length > 1 && lower.includes(kw));

  if (!needle) {
    return content.slice(0, maxLength);
  }

  const idx = lower.indexOf(needle);
  const start = Math.max(0, idx - Math.floor(maxLength / 3));
  const end = Math.min(content.length, start + maxLength);
  return content.slice(start, end);
}

export async function grepSearchRepository(params: {
  repo: RepoRef;
  version: string;
  keywords: string[];
  fileHints?: string[];
  limit?: number;
}): Promise<SearchHit[]> {
  const { repo, version, keywords, fileHints = [], limit = 12 } = params;
  const tree = await listRepositoryFiles(repo, version);

  const normalizedKeywords = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  const normalizedHints = fileHints.map((h) => h.toLowerCase());

  const candidates = tree
    .filter((item) => shouldIndexPath(item.path) && (item.size ?? 0) <= MAX_FILE_BYTES)
    .sort((a, b) => {
      const aPath = a.path.toLowerCase();
      const bPath = b.path.toLowerCase();
      const aHintScore = normalizedHints.some((hint) => aPath.includes(hint)) ? 1 : 0;
      const bHintScore = normalizedHints.some((hint) => bPath.includes(hint)) ? 1 : 0;
      if (aHintScore !== bHintScore) {
        return bHintScore - aHintScore;
      }
      return aPath.localeCompare(bPath);
    })
    .slice(0, MAX_FILES_SCANNED);

  const hits: SearchHit[] = [];

  for (const item of candidates) {
    const content = await getFileContent(repo, item.path, version);
    if (!content) {
      continue;
    }

    const lower = content.toLowerCase();
    let score = 0;

    for (const kw of normalizedKeywords) {
      if (!kw) {
        continue;
      }
      const matchCount = lower.split(kw).length - 1;
      if (matchCount > 0) {
        score += Math.min(5, matchCount);
      }
    }

    const pathLower = item.path.toLowerCase();
    for (const hint of normalizedHints) {
      if (hint && pathLower.includes(hint)) {
        score += 2;
      }
    }

    if (score <= 0) {
      continue;
    }

    hits.push({
      path: item.path,
      snippet: extractSnippet(content, normalizedKeywords),
      score,
      source: "grep",
    });

    if (hits.length >= limit * 2) {
      break;
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
