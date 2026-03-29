import { CodeChunk, generateEmbeddings, upsertCodeChunks } from "../services/embeddings";
import {
  getChangedFilesBetween,
  getFileContent,
  getLatestCommitSha,
  listRepositoryFiles,
  parseRepoRef,
} from "../services/github";
import { shouldIndexPath } from "../services/repo";
import { updateWorkspace } from "../services/workspace-service";

type IngestInput = {
  repo: string;
  workspaceId: string;
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

async function stableChunkId(repoId: string, version: string, suffix: string): Promise<string> {
  const msg = repoId + ":" + version + ":" + suffix;
  const data = new TextEncoder().encode(msg);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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

  try {
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
          id: await stableChunkId(repoId, version, chunk.idSuffix),
          repoId,
          version,
          filePath: path,
          content: chunk.text,
          embedding: vector,
        });
      }
    }

    if (chunks.length > 0) {
      await upsertCodeChunks(chunks);
    }

    // Update workspace status
    await updateWorkspace(input.workspaceId, {
      status: "ready",
      currentVersion: version,
    });

    return {
      repoId,
      version,
      processedFiles: indexable.length,
      chunkCount: chunks.length,
    };
  } catch (error) {
    console.error("Ingestion failed", error);
    await updateWorkspace(input.workspaceId, {
      status: "error",
    });
    throw error;
  }
}
