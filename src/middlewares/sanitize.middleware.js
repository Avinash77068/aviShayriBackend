/**
 * Express 4 compatible replacement for express-mongo-sanitize that also works
 * where req.query is a read-only getter. Strips keys containing `$` or `.` from
 * body/query/params to defeat MongoDB operator-injection ($gt, $where, ...).
 */
const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (key.includes("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (val && typeof val === "object") sanitizeInPlace(val);
  }
  return obj;
};

export const mongoSanitize = (req, _res, next) => {
  if (req.body) sanitizeInPlace(req.body);
  if (req.params) sanitizeInPlace(req.params);
  // req.query may be a getter in some setups — mutate its own props defensively.
  if (req.query && typeof req.query === "object") {
    try {
      sanitizeInPlace(req.query);
    } catch {
      /* read-only query — validators guard downstream */
    }
  }
  next();
};

export default mongoSanitize;
