import { PAGINATION } from "../constants/index.js";

/** Parse & clamp page/limit query params. */
export const parsePagination = (query = {}) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  page = Number.isFinite(page) && page > 0 ? page : PAGINATION.DEFAULT_PAGE;
  limit = Number.isFinite(limit) && limit > 0 ? limit : PAGINATION.DEFAULT_LIMIT;
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

/** Build a pagination meta object for the response envelope. */
export const buildMeta = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/** Translate a `?sort=field,-other` query into a Mongoose sort object. */
export const parseSort = (sort, fallback = { createdAt: -1 }) => {
  if (!sort) return fallback;
  return String(sort)
    .split(",")
    .reduce((acc, token) => {
      const t = token.trim();
      if (!t) return acc;
      if (t.startsWith("-")) acc[t.slice(1)] = -1;
      else acc[t] = 1;
      return acc;
    }, {});
};
