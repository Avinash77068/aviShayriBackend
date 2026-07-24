import crypto from "crypto";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/token.js";
import { userRepository } from "../repositories/index.js";
import { setAnonCookie } from "../helpers/cookie.js";
import { USER_STATUS, MESSAGES } from "../constants/index.js";

const extractToken = (req) => {
  const cookieToken = req.cookies?.[env.cookie.accessName];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  return null;
};

/** Require a valid access token; attaches `req.user`. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    const msg = err.name === "TokenExpiredError" ? MESSAGES.TOKEN_EXPIRED : MESSAGES.TOKEN_INVALID;
    throw ApiError.unauthorized(msg);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("Account no longer exists");
  if (user.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden(`Account is ${user.status}`);
  }

  req.user = user;
  req.token = token;
  return next();
});

/** Populate `req.user` if a token is present, but never reject. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);
    if (user && user.status === USER_STATUS.ACTIVE) req.user = user;
  } catch {
    /* ignore — anonymous request */
  }
  return next();
});

/**
 * Identify a signed-out visitor via a long-lived cookie so they can
 * like/bookmark without an account. No-op if `req.user` is already set.
 *
 * `createIfMissing`: pass true on write actions (like/bookmark), where a
 * stable identity must be minted so the toggle can be reversed later. Pass
 * false on read paths (viewing a shayari, listing bookmarks) so a casual
 * visitor who has never engaged isn't stamped with a cookie just for looking.
 */
export const identifyVisitor = (createIfMissing) =>
  (req, res, next) => {
    if (req.user) return next();
    let anonId = req.cookies?.[env.cookie.anonName];
    if (!anonId && createIfMissing) {
      anonId = crypto.randomUUID();
      setAnonCookie(res, anonId);
    }
    req.anonId = anonId || null;
    return next();
  };
