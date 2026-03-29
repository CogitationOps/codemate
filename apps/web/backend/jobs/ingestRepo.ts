import { createHash } from "node:crypto";

import { CodeChunk, generateEmbeddings, upsertCodeChunks } from "../services/embeddings";
import {
  getChangedFilesBetween,
  getFileContent,
  getLatestCommitSha,
  listRepositoryFiles,
  parseRepoRef,
} from "../services/github";
import { shouldIndexPath } from "../services/repo";

type IngestInput = {
  repo: string;
  branch?: string;
  previousVersion?: string;
};

function chunkContent(filePath: string, content: string): Array<{ idSuffix: string; text: string }> {
  const chunks: Array<{ idSuffix: string; text: string }> = [];
  const lines = content.split("\n");
  const blockSize = 80;
  let i = 0;
  while (i < lines.length) {
    const block = lines.slice(i, i + blockSize).join("\n").trim();
    if (block.length > 0) {
      chunks.push({
        idSuffix: filePath + ":" + String(i + 1),
        text: block.slice(0, 3000),
      });
    }
    i += blockSize;
  }
  return chunks;
}

function stableChunkId(repoId: string, version: string, suffix: string): string {
  return createHash("sha256").update(repoId + ":" + version + ":" + suffix).digest("hex");
}

export async function ingestRepository(input: IngestInput): Promise<{
  repoId: string;
  version: string;
  processedFiles: number;
  chunkCount: number;
}> {
  const repoRef = parseRepoRef(input.repo, input.branch);
  const repoId = repoRef.owner + "/" + repoRef.repo;
  const version = await getLatestCommitSha(repoRef);

  const changedFiles =
    input.previousVersion && input.previousVersion !== version
      ? await getChangedFilesBetween(repoRef, input.previousVersion, version)
      : null;

  const candidatePaths =
    changedFiles && changedFiles.length > 0
      ? changedFiles
      : (await listRepositoryFiles(repoRef, version)).map((item) => item.path);

  const indexable = candidatePaths.filter((p) => shouldIndexPath(p)).slice(0, 400);

  const chunks: CodeChunk[] = [];
  for (const path of indexable) {
    const content = await getFileContent(repoRef, path, version);
    if (!content) {
      continue;
    }

    const fileChunks = chunkContent(path, content);
    if (fileChunks.length === 0) {
      continue;
    }

    const vectors = await generateEmbeddings(fileChunks.map((c) => c.text));
    if (vectors.length === 0) {
      continue;
    }

    for (let i = 0; i < fileChunks.length; i += 1) {
      const vector = vectors[i];
      if (!vector) {
        continue;
      }
      const chunk = fileChunks[i];
      chunks.push({
        id: stableChunkId(repoId, version, chunk.idSuffix),
        repoId,
        version,
        filePath: path,
        content: chunk.text,
        embedding: vector,
      });
    }
  }

  await upsertCodeChunks(chunks);

  return {
    repoId,
    version,
    processedFiles: indexable.length,
    chunkCount: chunks.length,
  };
}
