import { Redis } from "@upstash/redis";
import { tasks } from "@trigger.dev/sdk/v3";
import { parseRepoRef } from "./github";
import { Workspace } from "../types";

const WORKSPACE_INDEX_KEY = "workspace:ids";
const WORKSPACE_KEY_PREFIX = "workspace:detail:";

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Redis configuration missing (UPSTASH_REDIS_REST_URL/TOKEN)");
  }
  return new Redis({ url, token });
}

export async function createWorkspace(name: string, repoUrl: string): Promise<Workspace> {
  const redis = getRedis();
  const repoRef = parseRepoRef(repoUrl);
  const repoId = `${repoRef.owner}/${repoRef.repo}`;
  const workspaceId = crypto.randomUUID();
  const now = Date.now();

  const workspace: Workspace = {
    id: workspaceId,
    name: name.trim() || repoId,
    repoUrl: repoUrl.trim(),
    repoId,
    currentVersion: "pending",
    status: "indexing",
    createdAt: now,
  };

  // 1. Save to Redis
  await redis.set(`${WORKSPACE_KEY_PREFIX}${workspaceId}`, workspace);
  await redis.zadd(WORKSPACE_INDEX_KEY, { score: now, member: workspaceId });

  // 2. Trigger async ingest via name to avoid Edge runtime SDK import issues
  // We use the string "repo_ingest" to avoid importing the task definition (and its heavy deps) into Edge
  await tasks.trigger("repo_ingest", {
    repo: repoUrl,
    workspaceId: workspaceId,
  });

  return workspace;
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const redis = getRedis();
  const data = await redis.get<Workspace>(`${WORKSPACE_KEY_PREFIX}${id}`);
  return data || null;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const redis = getRedis();
  const ids = await redis.zrange<string[]>(WORKSPACE_INDEX_KEY, 0, -1, { rev: true });
  
  const workspaces: Workspace[] = [];
  for (const id of ids) {
    const ws = await getWorkspace(id);
    if (ws) workspaces.push(ws);
  }
  return workspaces;
}

export async function updateWorkspace(id: string, updates: Partial<Workspace>): Promise<void> {
  const redis = getRedis();
  const existing = await getWorkspace(id);
  if (!existing) return;

  const updated = { ...existing, ...updates };
  await redis.set(`${WORKSPACE_KEY_PREFIX}${id}`, updated);
}
