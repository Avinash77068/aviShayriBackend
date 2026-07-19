/**
 * Estimate reading time in minutes. Shayari is short-form, so we round up
 * to a minimum of 1 minute and assume a slower, contemplative reading pace.
 */
export const calcReadingTime = (text, wordsPerMinute = 160) => {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

export default calcReadingTime;
