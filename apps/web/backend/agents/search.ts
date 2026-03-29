import { PlannerOutput, RepoRef, SearchOutput, parseSearchOutput } from "@/backend/types";
import { queryVersionedVectors } from "@/backend/services/embeddings";
import { grepSearchRepository } from "@/backend/services/repo";

export async function runSearchAgent(params: {
  repo: RepoRef;
  repoVersion: string;
  repoId: string;
  plan: PlannerOutput;
  query: string;
  limit?: number;
}): Promise<SearchOutput> {
  const grepHits = await grepSearchRepository({
    repo: params.repo,
    version: params.repoVersion,
    keywords: params.plan.keywords,
    fileHints: params.plan.fileHints,
    limit: params.limit ?? 12,
  });

  const byPath = new Map<string, { path: string; snippet: string; score: number }>();
  for (const hit of grepHits) {
    byPath.set(hit.path, hit);
  }

  if (byPath.size < Math.max(3, Math.floor((params.limit ?? 12) / 2))) {
    const vectorHits = await queryVersionedVectors({
      repoId: params.repoId,
      version: params.repoVersion,
      query: params.query,
      topK: Math.max(4, params.limit ?? 12),
    });
    for (const hit of vectorHits) {
      if (!byPath.has(hit.path)) {
        byPath.set(hit.path, hit);
      }
    }
  }

  const files = Array.from(byPath.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 12)
    .map((hit) => ({ path: hit.path, snippet: hit.snippet }));

  const parsed = parseSearchOutput({ files });
  return parsed ?? { files: [] };
}
