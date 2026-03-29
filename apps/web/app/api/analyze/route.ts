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

    let repoUrl = input.repo;
    let repoVersion = "";
    let repoRef;

    if (input.workspaceId) {
      const { getWorkspace } = await import("@/backend/services/workspace-service");
      const workspace = await getWorkspace(input.workspaceId);
      if (!workspace) {
        throw new Error("Workspace not found");
      }
      if (workspace.status !== "ready") {
        return NextResponse.json(
          { error: "Workspace is still indexing. Please wait." },
          { status: 202 }
        );
      }
      repoUrl = workspace.repoUrl;
      repoVersion = workspace.currentVersion;
      repoRef = parseRepoRef(repoUrl);
    } else {
      repoRef = parseRepoRef(repoUrl, input.branch);
      repoVersion = await getLatestCommitSha(repoRef);
    }

    const repoId = repoRef.owner + "/" + repoRef.repo;

    const planner = await runPlannerAgent(input.query);
    const search = await runSearchAgent({
      repo: repoRef,
      repoId,
      repoVersion,
      query: input.query,
      plan: planner,
      limit: input.searchLimit,
    });
    const context = await runContextBuilder({
      repo: repoRef,
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
