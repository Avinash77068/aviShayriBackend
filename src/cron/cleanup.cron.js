import { RefreshToken } from "../models/index.js";
import logger from "../config/logger.js";

/**
 * Purge revoked/expired refresh tokens. The TTL index removes expired docs
 * automatically, but this also clears tokens revoked more than 7 days ago.
 */
export const cleanupTokens = async () => {
  const cutoff = new Date(Date.now() - 7 * 86400000);
  const { deletedCount } = await RefreshToken.deleteMany({
    $or: [{ expiresAt: { $lt: new Date() } }, { revokedAt: { $lt: cutoff } }],
  });
  if (deletedCount) logger.info(`[cron] Cleaned up ${deletedCount} stale refresh tokens`);
  return { deletedCount };
};

export default cleanupTokens;
