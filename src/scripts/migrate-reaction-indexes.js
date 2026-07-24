/* eslint-disable no-console */
/**
 * One-off index migration for the `reactions` collection.
 *
 * The Reaction model used to require `user` and had a single unique index on
 * (user, shayari, type). Anonymous (signed-out) likes/bookmarks added an
 * `anonId` alternative identity, so the schema now defines two *partial*
 * unique indexes instead — one scoped to docs with `user`, one scoped to
 * docs with `anonId` (see models/reaction.model.js).
 *
 * `autoIndex` is disabled in production (config/db.js), so that change never
 * reaches the live collection on its own. Run this once after deploying the
 * schema change to reconcile it:
 *
 *   npm run migrate:reaction-index
 */
import { connectDB, disconnectDB } from "../config/db.js";
import logger from "../config/logger.js";
import { Reaction } from "../models/index.js";

const run = async () => {
  await connectDB();

  const before = await Reaction.collection.indexes();
  logger.info(`Indexes before: ${JSON.stringify(before.map((i) => i.name))}`);

  const result = await Reaction.syncIndexes();
  logger.info(`syncIndexes changes: ${JSON.stringify(result)}`);

  const after = await Reaction.collection.indexes();
  logger.info(`Indexes after: ${JSON.stringify(after.map((i) => i.name))}`);

  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
