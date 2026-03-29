import { logger, task } from "@trigger.dev/sdk/v3";

import { ingestRepository } from "../apps/web/backend/jobs/ingestRepo";

export const repoIngestTask = task({
  id: "repo_ingest",
  maxDuration: 1800,
  run: async (payload: { repo: string; workspaceId: string; branch?: string; previousVersion?: string }) => {
    const result = await ingestRepository(payload);
    logger.log("repo_ingest completed", result);
    return result;
  },
});
