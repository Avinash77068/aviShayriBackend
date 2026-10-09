import cron from "node-cron";
import logger from "../config/logger.js";
import { recomputeTrending } from "./trending.cron.js";
import { cleanupTokens } from "./cleanup.cron.js";
import env from "../config/env.js";
import { aiShayariService } from "../services/aiShayari.service.js";

const jobs = [];

const schedule = (expr, name, fn, options = {}) => {
  const job = cron.schedule(
    expr,
    async () => {
      try {
        await fn();
      } catch (err) {
        logger.error(`[cron:${name}] failed: ${err.message}`);
      }
    },
    { scheduled: false, ...options }
  );
  jobs.push({ name, job });
  return job;
};

export const startCronJobs = () => {
  if (process.env.DISABLE_CRON === "true") {
    logger.warn("[cron] disabled via DISABLE_CRON");
    return;
  }
  schedule("*/30 * * * *", "trending", recomputeTrending); // every 30 min
  schedule("0 3 * * *", "cleanup", cleanupTokens); // daily at 03:00
  if (env.openRouter.enabled) {
    // Run once per configured local day; skip a tick if generation is still running.
    let generating = false;
    schedule(env.openRouter.cron, "ai-shayari", async () => {
      if (generating) return;
      generating = true;
      try {
        await aiShayariService.generateDaily();
      } finally {
        generating = false;
      }
    }, { timezone: env.openRouter.timezone });
  }
  jobs.forEach(({ job }) => job.start());
  logger.info(`[cron] started ${jobs.length} scheduled jobs`);
};

export const stopCronJobs = () => {
  jobs.forEach(({ job }) => job.stop());
};

export { recomputeTrending, cleanupTokens };
