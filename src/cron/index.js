import cron from "node-cron";
import logger from "../config/logger.js";
import { recomputeTrending } from "./trending.cron.js";
import { cleanupTokens } from "./cleanup.cron.js";

const jobs = [];

const schedule = (expr, name, fn) => {
  const job = cron.schedule(
    expr,
    async () => {
      try {
        await fn();
      } catch (err) {
        logger.error(`[cron:${name}] failed: ${err.message}`);
      }
    },
    { scheduled: false }
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
  jobs.forEach(({ job }) => job.start());
  logger.info(`[cron] started ${jobs.length} scheduled jobs`);
};

export const stopCronJobs = () => {
  jobs.forEach(({ job }) => job.stop());
};

export { recomputeTrending, cleanupTokens };
