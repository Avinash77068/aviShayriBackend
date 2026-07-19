import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";

/**
 * JWT helpers. Access & refresh tokens are short/long lived respectively.
 * Reset & verify tokens are single-purpose, signed with their own secrets.
 */
export const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });

export const signResetToken = (payload) =>
  jwt.sign(payload, env.jwt.resetSecret, { expiresIn: env.jwt.resetExpiresIn });

export const signVerifyToken = (payload) =>
  jwt.sign(payload, env.jwt.verifySecret, { expiresIn: env.jwt.verifyExpiresIn });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);
export const verifyResetToken = (token) => jwt.verify(token, env.jwt.resetSecret);
export const verifyVerifyToken = (token) => jwt.verify(token, env.jwt.verifySecret);

/** SHA-256 hash used to store refresh tokens at rest (never store raw JWTs). */
export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Random opaque token for links that don't need to be a JWT. */
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

/** Convert a JWT-style duration (e.g. "7d", "15m") into milliseconds. */
export const durationToMs = (str) => {
  const match = /^(\d+)([smhd])$/.exec(String(str).trim());
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2];
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * map[unit];
};
