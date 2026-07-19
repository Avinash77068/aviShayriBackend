import { Shayari } from "../models/index.js";
import logger from "../config/logger.js";
import { STATUS } from "../constants/index.js";

/**
 * Recompute a time-decayed popularity score and refresh the `trending` flag.
 * Score = weighted engagement / age^gravity (Hacker-News style decay).
 */
export const recomputeTrending = async () => {
  const now = Date.now();
  const gravity = 1.5;
  const published = await Shayari.find({ status: STATUS.PUBLISHED })
    .select("views likes shares bookmarks commentCount publishedAt createdAt")
    .lean();

  if (!published.length) return { updated: 0 };

  const scored = published.map((s) => {
    const engagement =
      s.views * 1 + s.likes * 4 + s.shares * 6 + s.bookmarks * 5 + s.commentCount * 3;
    const ageHours = Math.max(1, (now - new Date(s.publishedAt || s.createdAt).getTime()) / 3600000);
    const score = engagement / Math.pow(ageHours + 2, gravity);
    return { id: s._id, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const trendingIds = new Set(scored.slice(0, 20).map((x) => String(x.id)));

  await Promise.all(
    scored.map((x) =>
      Shayari.updateOne(
        { _id: x.id },
        { popularityScore: Math.round(x.score * 1000) / 1000, trending: trendingIds.has(String(x.id)) }
      )
    )
  );

  logger.info(`[cron] Recomputed trending for ${scored.length} shayari`);
  return { updated: scored.length };
};

export default recomputeTrending;
