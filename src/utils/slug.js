import slugify from "slugify";

const OPTS = { lower: true, strict: true, trim: true, locale: "en" };

/** Create a URL-safe slug from any string (falls back for pure-Unicode input). */
export const toSlug = (text) => {
  const base = slugify(String(text || ""), OPTS);
  return base || `item-${Date.now().toString(36)}`;
};

/**
 * Ensure a slug is unique within a collection by appending -2, -3, ...
 * `existsFn` is an async predicate: (candidate) => boolean.
 */
export const uniqueSlug = async (text, existsFn, { ignoreId = null } = {}) => {
  const base = toSlug(text);
  let candidate = base;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await existsFn(candidate, ignoreId)) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  return candidate;
};
