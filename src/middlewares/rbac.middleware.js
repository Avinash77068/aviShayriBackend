import ApiError from "../utils/ApiError.js";
import { ROLE_HIERARCHY, MESSAGES } from "../constants/index.js";

/**
 * Restrict a route to one or more explicit roles.
 * Usage: authorize("admin", "editor")
 */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized(MESSAGES.UNAUTHORIZED));
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden(MESSAGES.FORBIDDEN));
  return next();
};

/**
 * Require at least a minimum role level (uses ROLE_HIERARCHY).
 * Usage: requireRole("editor") — allows editor and admin.
 */
export const requireRole = (minRole) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized(MESSAGES.UNAUTHORIZED));
  const have = ROLE_HIERARCHY[req.user.role] || 0;
  const need = ROLE_HIERARCHY[minRole] || 0;
  if (have < need) return next(ApiError.forbidden(MESSAGES.FORBIDDEN));
  return next();
};
