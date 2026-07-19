import app from "./src/app.js";
import env from "./src/config/env.js";
import { connectDB, disconnectDB } from "./src/config/db.js";
import logger from "./src/config/logger.js";
import { startCronJobs, stopCronJobs } from "./src/cron/index.js";

let server;

const start = async () => {
  try {
    await connectDB();
    server = app.listen(env.port, () => {
      logger.info(`Shayari API running on http://localhost:${env.port} (${env.nodeEnv})`);
      logger.info(`API base: ${env.apiPrefix}  •  Docs: ${env.apiPrefix}/docs`);
    });
    startCronJobs();
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

/* -------- Graceful shutdown -------- */
const shutdown = async (signal) => {
  logger.warn(`${signal} received — shutting down gracefully`);
  stopCronJobs();
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(0);
};

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
});
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

start();
