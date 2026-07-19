import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/token.js";
import { userRepository } from "../repositories/index.js";
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
