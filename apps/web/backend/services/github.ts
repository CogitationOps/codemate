import { RepoRef } from "../types";

type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

type GitHubContentResponse = {
  type: "file" | "dir";
  encoding?: "base64";
  content?: string;
  size?: number;
};

type CommitFile = {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
  patch?: string;
};

export type CommitDiff = {
  sha: string;
  files: CommitFile[];
};

const GITHUB_API_BASE = "https://api.github.com";

function decodeBase64Utf8(value: string): string {
  const normalized = value.replace(/\s/g, "");

  if (typeof atob === "function") {
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  throw new Error("Base64 decode is not available in this runtime.");
}

export function parseRepoRef(input: string, branch?: string): RepoRef {
  const trimmed = input.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error(`Invalid GitHub repository URL: ${input}`);
    }
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, ""),
      branch,
    };
  }

  const slashParts = trimmed.split("/").filter(Boolean);
  if (slashParts.length !== 2) {
    throw new Error(`Invalid repository identifier: ${input}. Use owner/repo or full URL.`);
  }

  return { owner: slashParts[0], repo: slashParts[1].replace(/\.git$/, ""), branch };
}

function headers(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubRequest<T>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, { headers: headers(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error (${res.status}) for ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export async function getDefaultBranch(repo: RepoRef): Promise<string> {
  const data = await githubRequest<{ default_branch: string }>(`/repos/${repo.owner}/${repo.repo}`);
  return repo.branch ?? data.default_branch;
}

export async function getLatestCommitSha(repo: RepoRef): Promise<string> {
  const branch = await getDefaultBranch(repo);
  const data = await githubRequest<{ sha: string }>(`/repos/${repo.owner}/${repo.repo}/commits/${branch}`);
  return data.sha;
}

export async function listRepositoryFiles(repo: RepoRef, sha: string): Promise<GitHubTreeItem[]> {
  const tree = await githubRequest<{ tree: GitHubTreeItem[] }>(
    `/repos/${repo.owner}/${repo.repo}/git/trees/${sha}?recursive=1`
  );
  return tree.tree.filter((item) => item.type === "blob");
}

export async function getFileContent(repo: RepoRef, path: string, sha: string): Promise<string | null> {
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const file = await githubRequest<GitHubContentResponse>(
    `/repos/${repo.owner}/${repo.repo}/contents/${encodedPath}?ref=${sha}`
  );

  if (file.type !== "file" || !file.content || file.encoding !== "base64") {
    return null;
  }

  return decodeBase64Utf8(file.content);
}

export async function getCommitDiff(repo: RepoRef, commitSha: string): Promise<CommitDiff> {
  const data = await githubRequest<{ sha: string; files: CommitFile[] }>(
    `/repos/${repo.owner}/${repo.repo}/commits/${commitSha}`
  );

  return {
    sha: data.sha,
    files: data.files ?? [],
  };
}

export async function getChangedFilesBetween(
  repo: RepoRef,
  baseSha: string,
  headSha: string
): Promise<string[]> {
  const data = await githubRequest<{ files: Array<{ filename: string }> }>(
    `/repos/${repo.owner}/${repo.repo}/compare/${baseSha}...${headSha}`
  );

  return (data.files ?? []).map((file) => file.filename);
}
