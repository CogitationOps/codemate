import { NextResponse } from "next/server";

import { runAnalyzerAgent } from "@/backend/agents/analyzer";
import { runContextBuilder } from "@/backend/agents/context";
import { formatAgentResponse } from "@/backend/agents/formatter";
import { runPlannerAgent } from "@/backend/agents/planner";
import { runSearchAgent } from "@/backend/agents/search";
import { upsertRelevantContextVectors } from "@/backend/services/embeddings";
import { getLatestCommitSha, parseRepoRef } from "@/backend/services/github";
import { parseAnalyzeRequest } from "@/backend/types";

export const maxDuration = 30;
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = parseAnalyzeRequest(body);

    const repo = parseRepoRef(input.repo, input.branch);
    const repoId = repo.owner + "/" + repo.repo;
    const repoVersion = await getLatestCommitSha(repo);

    const planner = await runPlannerAgent(input.query);
    const search = await runSearchAgent({
      repo,
      repoId,
      repoVersion,
      query: input.query,
      plan: planner,
      limit: input.searchLimit,
    });
    const context = await runContextBuilder({
      repo,
      repoVersion,
      search,
      limit: input.contextLimit,
    });
    const analysis = await runAnalyzerAgent({
      query: input.query,
      context,
    });

    await upsertRelevantContextVectors({
      repoId,
      version: repoVersion,
      files: context.relevantFiles.map((file) => ({
        path: file.path,
        content: file.content,
      })),
    }).catch(() => undefined);

    const formatted = formatAgentResponse({
      query: input.query,
      planner,
      search,
      context,
      analysis,
    });

    return NextResponse.json({
      repo: repoId,
      version: repoVersion,
      planner,
      search,
      context,
      analysis,
      formatted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analysis error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
