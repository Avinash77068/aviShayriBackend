export const ROLES = Object.freeze({
  ADMIN: "admin",
  EDITOR: "editor",
  USER: "user",
});

export const ROLE_HIERARCHY = Object.freeze({
  [ROLES.ADMIN]: 3,
  [ROLES.EDITOR]: 2,
  [ROLES.USER]: 1,
});

export const STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING: "pending", // submitted by a regular user, awaiting admin approval
  PUBLISHED: "published",
  ARCHIVED: "archived",
});

export const NOTIFICATION_TYPES = Object.freeze({
  SHAYARI_SUBMISSION: "shayari_submission",
  COMMENT_REPORT: "comment_report",
  SYSTEM: "system",
});

export const USER_STATUS = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
  BANNED: "banned",
});

export const COMMENT_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  SPAM: "spam",
  REJECTED: "rejected",
});

export const REACTION = Object.freeze({
  LIKE: "like",
  BOOKMARK: "bookmark",
  VIEW: "view",
  SHARE: "share",
});

export const AUDIT_ACTIONS = Object.freeze({
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LOGIN: "login",
  LOGOUT: "logout",
  BULK: "bulk",
});

export const HTTP = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY: 429,
  SERVER_ERROR: 500,
});

export const MESSAGES = Object.freeze({
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_FOUND: "Resource not found",
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_IN_USE: "Email is already registered",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_INVALID: "Invalid token",
  VALIDATION_FAILED: "Validation failed",
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
});

export default {
  ROLES,
  ROLE_HIERARCHY,
  STATUS,
  USER_STATUS,
  COMMENT_STATUS,
  REACTION,
  AUDIT_ACTIONS,
  HTTP,
  MESSAGES,
  PAGINATION,
};
