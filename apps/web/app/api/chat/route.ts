import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
  type ToolSet,
  type UIMessage,
} from "ai";

import { runAnalyzerAgent } from "@/backend/agents/analyzer";
import { runContextBuilder } from "@/backend/agents/context";
import { formatAgentResponse } from "@/backend/agents/formatter";
import { runPlannerAgent } from "@/backend/agents/planner";
import { runSearchAgent } from "@/backend/agents/search";
import { analyzeCommit } from "@/backend/jobs/analyzeCommits";
import { saveChatConversation } from "@/backend/services/chat-store";
import { upsertRelevantContextVectors } from "@/backend/services/embeddings";
import { getLatestCommitSha, parseRepoRef } from "@/backend/services/github";
import { parseAnalyzeRequest, type AnalyzeRequest } from "@/backend/types";

export const maxDuration = 30;
export const runtime = "edge";

type RepoQueryInput = {
  repo: string;
  query: string;
  branch?: string;
  contextLimit?: number;
  searchLimit?: number;
};

function normalizeAnalyzeInput(input: RepoQueryInput): AnalyzeRequest {
  return parseAnalyzeRequest({
    repo: input.repo,
    query: input.query,
    branch: input.branch,
    contextLimit: input.contextLimit,
    searchLimit: input.searchLimit,
  });
}

async function runPipeline(input: RepoQueryInput) {
  const normalized = normalizeAnalyzeInput(input);
  const repo = parseRepoRef(normalized.repo, normalized.branch);
  const repoId = repo.owner + "/" + repo.repo;
  const version = await getLatestCommitSha(repo);

  const planner = await runPlannerAgent(normalized.query);
  const search = await runSearchAgent({
    repo,
    repoVersion: version,
    repoId,
    plan: planner,
    query: normalized.query,
    limit: normalized.searchLimit,
  });
  const context = await runContextBuilder({
    repo,
    repoVersion: version,
    search,
    limit: normalized.contextLimit,
  });
  const analysis = await runAnalyzerAgent({
    query: normalized.query,
    context,
  });
  await upsertRelevantContextVectors({
    repoId,
    version,
    files: context.relevantFiles.map((file) => ({ path: file.path, content: file.content })),
  }).catch(() => undefined);

  const formatted = formatAgentResponse({
    query: normalized.query,
    planner,
    search,
    context,
    analysis,
  });

  return { repoId, version, planner, search, context, analysis, formatted };
}

const repoQuerySchema = jsonSchema<RepoQueryInput>({
  type: "object",
  properties: {
    repo: {
      type: "string",
      description: "Repository as owner/repo or GitHub URL",
    },
    query: {
      type: "string",
      description: "User question about bugs/features/refactors/explanations",
    },
    branch: {
      type: "string",
      description: "Optional branch name",
    },
    contextLimit: {
      type: "number",
      description: "Optional context file cap (3-10)",
    },
    searchLimit: {
      type: "number",
      description: "Optional search hit cap (5-30)",
    },
  },
  required: ["repo", "query"],
  additionalProperties: false,
});

const commitSchema = jsonSchema<{ repo: string; commitId: string; branch?: string }>({
  type: "object",
  properties: {
    repo: { type: "string", description: "Repository as owner/repo or GitHub URL" },
    commitId: { type: "string", description: "Commit SHA to analyze" },
    branch: { type: "string", description: "Optional branch name" },
  },
  required: ["repo", "commitId"],
  additionalProperties: false,
});

const tools = {
  planner: tool({
    description: "Extract intent and search keywords from a user code question.",
    inputSchema: jsonSchema<{ query: string }>({
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
      additionalProperties: false,
    }),
    execute: async ({ query }: { query: string }) => {
      return await runPlannerAgent(query);
    },
  }),
  search: tool({
    description: "Run grep-first repository search with vector fallback on the latest commit version.",
    inputSchema: repoQuerySchema,
    execute: async (input: RepoQueryInput) => {
      const normalized = normalizeAnalyzeInput(input);
      const repo = parseRepoRef(normalized.repo, normalized.branch);
      const repoId = repo.owner + "/" + repo.repo;
      const version = await getLatestCommitSha(repo);
      const planner = await runPlannerAgent(normalized.query);
      const search = await runSearchAgent({
        repo,
        repoVersion: version,
        repoId,
        query: normalized.query,
        plan: planner,
        limit: normalized.searchLimit,
      });

      return { repo: repoId, version, planner, search };
    },
  }),
  context_builder: tool({
    description: "Build bounded context files from search results and expand local imports.",
    inputSchema: repoQuerySchema,
    execute: async (input: RepoQueryInput) => {
      const normalized = normalizeAnalyzeInput(input);
      const repo = parseRepoRef(normalized.repo, normalized.branch);
      const repoId = repo.owner + "/" + repo.repo;
      const version = await getLatestCommitSha(repo);
      const planner = await runPlannerAgent(normalized.query);
      const search = await runSearchAgent({
        repo,
        repoVersion: version,
        repoId,
        query: normalized.query,
        plan: planner,
        limit: normalized.searchLimit,
      });
      const context = await runContextBuilder({
        repo,
        repoVersion: version,
        search,
        limit: normalized.contextLimit,
      });

      return { repo: repoId, version, planner, search, context };
    },
  }),
  analyzer: tool({
    description: "Generate structured issues and TODOs from bounded repository context.",
    inputSchema: repoQuerySchema,
    execute: async (input: RepoQueryInput) => {
      const pipeline = await runPipeline(input);
      return {
        repo: pipeline.repoId,
        version: pipeline.version,
        analysis: pipeline.analysis,
      };
    },
  }),
  full_analyze: tool({
    description: "Run full repository analysis pipeline and return planner/search/context/analysis/format.",
    inputSchema: repoQuerySchema,
    execute: async (input: RepoQueryInput) => {
      const pipeline = await runPipeline(input);
      return {
        repo: pipeline.repoId,
        version: pipeline.version,
        planner: pipeline.planner,
        search: pipeline.search,
        context: pipeline.context,
        analysis: pipeline.analysis,
        formatted: pipeline.formatted,
      };
    },
  }),
  commit_analysis: tool({
    description: "Analyze a commit diff and estimate risk level with a concise summary.",
    inputSchema: commitSchema,
    execute: async ({
      repo,
      branch,
      commitId,
    }: {
      repo: string;
      branch?: string;
      commitId: string;
    }) => {
      return await analyzeCommit({ repo, branch, commitId });
    },
  }),
} satisfies ToolSet;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    id?: string;
    messages?: UIMessage[];
  };
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const chatId = typeof body.id === "string" && body.id.trim().length > 0 ? body.id : crypto.randomUUID();

  if (!process.env.OPENAI_API_KEY && !process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      {
        error:
          "Set OPENAI_API_KEY (or AI_GATEWAY_API_KEY) in apps/web/.env.local to enable chat.",
      },
      { status: 500 }
    );
  }

  const result = streamText({
    system:
      "You are Codemate, a production-grade repository analysis assistant. Use tools for repository-specific claims. " +
      "Do not guess file contents. Keep answers concise and action-oriented.",
    messages: await convertToModelMessages(messages, { tools }),
    model: openai("gpt-4.1-mini"),
    tools,
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: updatedMessages }) => {
      await saveChatConversation(chatId, updatedMessages);
    },
  });
}
