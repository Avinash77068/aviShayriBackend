import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

mongoose.set("strictQuery", true);

let isConnected = false;

/**
 * Connect to MongoDB with sensible pool + timeout defaults and
 * automatic retry logging. Safe to call once at boot.
 */
// Hosts this project must never write to (e.g. the developer's company
// staging cluster that leaks in via the shell profile). Override with
// ALLOW_SHARED_DB=true only if you are absolutely sure.
const BLOCKED_HOST_PATTERNS = [/revv-staging/i];

export const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  if (process.env.ALLOW_SHARED_DB !== "true") {
    const blocked = BLOCKED_HOST_PATTERNS.find((rx) => rx.test(env.mongoUri));
    if (blocked) {
      throw new Error(
        `Refusing to connect: MONGODB_URI matches a blocked shared cluster (${blocked}). ` +
          `Point MONGODB_URI at a project-dedicated database, or set ALLOW_SHARED_DB=true to bypass.`
      );
    }
  }

  const safeUri = env.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
  logger.info(`Connecting to MongoDB: ${safeUri}`);

  mongoose.connection.on("connected", () => {
    isConnected = true;
    logger.info("MongoDB connected");
  });
  mongoose.connection.on("error", (err) => logger.error(`MongoDB error: ${err.message}`));
  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(env.mongoUri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: !env.isProd,
  });

  return mongoose.connection;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  isConnected = false;
};

export default connectDB;
