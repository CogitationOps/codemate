import { logger, task } from "@trigger.dev/sdk/v3";

import { analyzeCommit } from "../apps/web/backend/jobs/analyzeCommits";

export const commitAnalysisTask = task({
  id: "commit_analysis",
  maxDuration: 600,
  run: async (payload: { repo: string; branch?: string; commitId: string }) => {
    const result = await analyzeCommit(payload);
    logger.log("commit_analysis completed", result);
    return result;
  },
});
