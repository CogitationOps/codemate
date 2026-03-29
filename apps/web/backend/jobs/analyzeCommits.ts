import { getCommitDiff, parseRepoRef } from "../services/github";
import { generateStructuredOrFallback } from "../services/llm";

export type CommitRisk = "low" | "medium" | "high";

export type CommitAnalysis = {
  commitId: string;
  workspaceId: string;
  risk: CommitRisk;
  summary: string;
};

export async function analyzeCommit(params: {
  repo: string;
  workspaceId: string;
  branch?: string;
  commitId: string;
}): Promise<CommitAnalysis> {
  const repoRef = parseRepoRef(params.repo, params.branch);
  const diff = await getCommitDiff(repoRef, params.commitId);

  // Combine heuristic with LLM
  const filesChanged = diff.files.length;
  const systemPrompt = `You are a senior security engineer. Analyze the following commit diff and determine the risk level (low, medium, high) and provide a concise summary. Return strict JSON only.`;
  
  const diffBrief = diff.files
    .slice(0, 10)
    .map((f) => `- ${f.filename} (+${f.additions}, -${f.deletions})`)
    .join("\n");

  const fallback: CommitAnalysis = {
    commitId: diff.sha,
    workspaceId: params.workspaceId,
    risk: filesChanged > 50 ? "high" : filesChanged > 10 ? "medium" : "low",
    summary: `Changed ${filesChanged} files across repo.`,
  };

  const result = await generateStructuredOrFallback<CommitAnalysis>({
    system: systemPrompt,
    prompt: `Analyze this commit:\n${diffBrief}\n\nTotal files: ${filesChanged}`,
    fallback,
    parser: (val: unknown) => {
      const v = val as Record<string, unknown>;
      if (typeof v?.risk === "string" && typeof v?.summary === "string") {
        return {
          commitId: diff.sha,
          workspaceId: params.workspaceId,
          risk: v.risk as CommitRisk,
          summary: v.summary,
        };
      }
      return null;
    },
  });

  return result;
}
