import env from "../config/env.js";
import { durationToMs } from "../utils/token.js";

const base = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
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
