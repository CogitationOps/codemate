import { getCommitDiff, parseRepoRef } from "../services/github";

export type CommitRisk = "low" | "medium" | "high";

export type CommitAnalysis = {
  commitId: string;
  risk: CommitRisk;
  summary: string;
};

function scoreCommitRisk(files: Array<{ filename: string; additions: number; deletions: number; patch?: string }>): {
  risk: CommitRisk;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  const totalChanges = files.reduce((acc, file) => acc + file.additions + file.deletions, 0);
  if (totalChanges > 600) {
    score += 3;
    reasons.push("Large diff size");
  } else if (totalChanges > 200) {
    score += 2;
    reasons.push("Moderate diff size");
  }

  const criticalTouches = files.filter((file) =>
    /(auth|payment|billing|permission|security|migration|schema)/i.test(file.filename)
  );
  if (criticalTouches.length > 0) {
    score += 2;
    reasons.push("Touches high-risk modules");
  }

  const likelyBreaking = files.filter((file) => /(interface|type|config|env|docker|workflow)/i.test(file.filename));
  if (likelyBreaking.length > 0) {
    score += 1;
    reasons.push("Touches shared contracts or configuration");
  }

  const riskyPatch = files.some((file) => /(throw new|TODO|FIXME|@ts-ignore)/i.test(file.patch ?? ""));
  if (riskyPatch) {
    score += 1;
    reasons.push("Patch contains risky markers");
  }

  if (score >= 5) {
    return { risk: "high", reasons };
  }
  if (score >= 3) {
    return { risk: "medium", reasons };
  }
  return { risk: "low", reasons: reasons.length > 0 ? reasons : ["Small isolated change"] };
}

export async function analyzeCommit(params: { repo: string; branch?: string; commitId: string }): Promise<CommitAnalysis> {
  const repoRef = parseRepoRef(params.repo, params.branch);
  const diff = await getCommitDiff(repoRef, params.commitId);
  const scored = scoreCommitRisk(diff.files);

  return {
    commitId: diff.sha,
    risk: scored.risk,
    summary: "Changed " + diff.files.length + " files. " + scored.reasons.join("; "),
  };
}
