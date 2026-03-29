import { SearchHit } from "../types";

export type CodeChunk = {
  id: string;
  repoId: string;
  version: string;
  filePath: string;
  content: string;
  embedding: number[];
};

export type EmbeddingQuery = {
  repoId: string;
  version: string;
  query: string;
  topK?: number;
};

const OPENAI_EMBEDDINGS_MODEL = "text-embedding-3-small";

function upstashBaseUrl(): string | null {
  return process.env.UPSTASH_VECTOR_REST_URL ?? null;
}

function upstashToken(): string | null {
  return process.env.UPSTASH_VECTOR_REST_TOKEN ?? null;
}

function openaiKey(): string | null {
  return process.env.OPENAI_API_KEY ?? null;
}

function ensureVersion(version: string): void {
  if (version.trim().length < 7) {
    throw new Error("Invalid repo version. Expected a commit SHA-like value.");
  }
}

function buildVersionFilter(repoId: string, version: string): string {
  return 'repoId = "' + repoId + '" AND version = "' + version + '"';
}

export function versionNamespace(repoId: string, version: string): string {
  ensureVersion(version);
  return repoId + ":" + version;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const key = openaiKey();
  if (!key || texts.length === 0) {
    return [];
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + key,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDINGS_MODEL,
      input: texts,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error("Failed to generate embeddings: " + res.status + " " + body.slice(0, 240));
  }

  const json = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return json.data.map((item) => item.embedding);
}

export async function upsertCodeChunks(chunks: CodeChunk[]): Promise<void> {
  const baseUrl = upstashBaseUrl();
  const token = upstashToken();
  if (!baseUrl || !token || chunks.length === 0) {
    return;
  }

  const payload = chunks.map((chunk) => ({
    id: chunk.id,
    vector: chunk.embedding,
    metadata: {
      repoId: chunk.repoId,
      version: chunk.version,
      filePath: chunk.filePath,
      content: chunk.content,
    },
  }));

  const res = await fetch(baseUrl + "/upsert", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error("Upstash upsert failed: " + res.status + " " + body.slice(0, 240));
  }
}

export async function deleteEmbeddingsForVersion(params: {
  repoId: string;
  version: string;
}): Promise<void> {
  const baseUrl = upstashBaseUrl();
  const token = upstashToken();
  if (!baseUrl || !token) {
    return;
  }

  ensureVersion(params.version);

  const res = await fetch(baseUrl + "/delete", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: buildVersionFilter(params.repoId, params.version),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error("Upstash delete failed: " + res.status + " " + body.slice(0, 240));
  }
}

export async function queryVersionedVectors(params: EmbeddingQuery): Promise<SearchHit[]> {
  const baseUrl = upstashBaseUrl();
  const token = upstashToken();
  ensureVersion(params.version);

  if (!baseUrl || !token || params.query.trim().length === 0) {
    return [];
  }

  const embeddings = await generateEmbeddings([params.query]);
  const queryEmbedding = embeddings[0];
  if (!queryEmbedding) {
    return [];
  }

  const res = await fetch(baseUrl + "/query", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vector: queryEmbedding,
      topK: params.topK ?? 8,
      includeMetadata: true,
      filter: buildVersionFilter(params.repoId, params.version),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error("Upstash query failed: " + res.status + " " + body.slice(0, 240));
  }

  const data = (await res.json()) as {
    result?: Array<{
      score?: number;
      metadata?: { filePath?: string; content?: string; version?: string; repoId?: string };
    }>;
  };

  const hits: SearchHit[] = [];
  for (const item of data.result ?? []) {
    const filePath = item.metadata?.filePath;
    const content = item.metadata?.content;
    const hitVersion = item.metadata?.version;
    const hitRepoId = item.metadata?.repoId;
    if (!filePath || !content || hitVersion !== params.version || hitRepoId !== params.repoId) {
      continue;
    }

    hits.push({
      path: filePath,
      snippet: content.slice(0, 280),
      score: item.score ?? 0,
      source: "vector",
    });
  }

  return hits;
}
