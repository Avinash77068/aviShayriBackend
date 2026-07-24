import env from "../config/env.js";
import { durationToMs } from "../utils/token.js";

const isCrossSite = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL) || env.nodeEnv === "production";

const base = () => ({
  httpOnly: true,
  secure: true,
  sameSite: isCrossSite ? "none" : env.cookie.sameSite,
  domain: env.cookie.domain,
  path: "/",
});

/** Set the access + refresh token cookies as secure, HTTP-only cookies. */
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (accessToken) {
    res.cookie(env.cookie.accessName, accessToken, {
      ...base(),
      maxAge: durationToMs(env.jwt.accessExpiresIn),
    });
  }
  if (refreshToken) {
    res.cookie(env.cookie.refreshName, refreshToken, {
      ...base(),
      maxAge: durationToMs(env.jwt.refreshExpiresIn),
    });
  }
};

/** Clear auth cookies on logout. */
export const clearAuthCookies = (res) => {
  const opts = { ...base() };
  delete opts.maxAge;
  res.clearCookie(env.cookie.accessName, opts);
  res.clearCookie(env.cookie.refreshName, opts);
};

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Identify anonymous visitors so they can like/bookmark without an account.
 * Same secure/cross-site attributes as the auth cookies, just longer-lived.
 */
export const setAnonCookie = (res, anonId) => {
  res.cookie(env.cookie.anonName, anonId, { ...base(), maxAge: ONE_YEAR_MS });
};
