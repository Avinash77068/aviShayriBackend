import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { userRepository } from "../repositories/index.js";
import { RefreshToken } from "../models/index.js";
import {
  signAccessToken,
  signRefreshToken,
  signResetToken,
  signVerifyToken,
  verifyRefreshToken,
  verifyResetToken,
  verifyVerifyToken,
  hashToken,
  durationToMs,
} from "../utils/token.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../helpers/mailer.js";
import { cleanText } from "../helpers/sanitize.js";
import { MESSAGES, ROLES } from "../constants/index.js";

const buildAccessPayload = (user) => ({ sub: user._id.toString(), role: user.role, email: user.email });

/** Issue a signed access + refresh pair and persist the refresh token (hashed). */
const issueTokens = async (user, { userAgent = "", ip = "" } = {}) => {
  const accessToken = signAccessToken(buildAccessPayload(user));
  const refreshToken = signRefreshToken({ sub: user._id.toString() });
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent,
    ip,
    expiresAt: new Date(Date.now() + durationToMs(env.jwt.refreshExpiresIn)),
  });
  return { accessToken, refreshToken };
};

const sendVerification = async (user) => {
  const token = signVerifyToken({ sub: user._id.toString() });
  const link = `${env.clientUrl}/verify-email?token=${token}`;
  await sendVerificationEmail(user.email, user.name, link);
  return link;
};

export const authService = {
  async register({ name, email, password }, ctx = {}) {
    if (await userRepository.emailExists(email)) throw ApiError.conflict(MESSAGES.EMAIL_IN_USE);
    const user = await userRepository.create({ name: cleanText(name), email, password });
    const tokens = await issueTokens(user, ctx);
    const verifyLink = await sendVerification(user);
    return { user: user.toSafeJSON(), ...tokens, verifyLink: env.isProd ? undefined : verifyLink };
  },

  async login({ email, password }, ctx = {}) {
    const user = await userRepository.findByEmail(email, { withPassword: true });
    if (!user) throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
    const match = await user.comparePassword(password);
    if (!match) throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
    if (user.status !== "active") throw ApiError.forbidden(`Account is ${user.status}`);

    user.lastLoginAt = new Date();
    await user.save();
    const tokens = await issueTokens(user, ctx);
    return { user: user.toSafeJSON(), ...tokens };
  },

  /** Rotate the refresh token: revoke the presented one, issue a fresh pair. */
  async refresh(rawRefreshToken, ctx = {}) {
    if (!rawRefreshToken) throw ApiError.unauthorized("Refresh token missing");
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw ApiError.unauthorized(MESSAGES.TOKEN_INVALID);
    }

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await RefreshToken.findOne({ tokenHash });
    if (!stored || !stored.isActive()) {
      // Token reuse / theft detection: revoke all sessions for this user.
      if (stored && stored.revokedAt) {
        await RefreshToken.updateMany(
          { user: payload.sub, revokedAt: null },
          { revokedAt: new Date() }
        );
      }
      throw ApiError.unauthorized("Refresh token is no longer valid");
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || user.status !== "active") throw ApiError.unauthorized("Account unavailable");

    const tokens = await issueTokens(user, ctx);
    stored.revokedAt = new Date();
    stored.replacedByHash = hashToken(tokens.refreshToken);
    await stored.save();

    return { user: user.toSafeJSON(), ...tokens };
  },

  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    await RefreshToken.findOneAndUpdate(
      { tokenHash: hashToken(rawRefreshToken), revokedAt: null },
      { revokedAt: new Date() }
    );
  },

  async logoutAll(userId) {
    await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
  },

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    // Always return success to avoid email enumeration.
    if (!user) return { sent: true };
    const token = signResetToken({ sub: user._id.toString() });
    const link = `${env.clientUrl}/reset-password?token=${token}`;
    await sendResetPasswordEmail(user.email, user.name, link);
    return { sent: true, resetLink: env.isProd ? undefined : link };
  },

  async resetPassword(token, newPassword) {
    let payload;
    try {
      payload = verifyResetToken(token);
    } catch {
      throw ApiError.badRequest("Reset link is invalid or has expired");
    }
    const user = await userRepository.findById(payload.sub);
    if (!user) throw ApiError.notFound("Account not found");
    user.password = newPassword;
    await user.save();
    await this.logoutAll(user._id); // invalidate existing sessions
    return { reset: true };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId, { select: "+password" });
    if (!user) throw ApiError.notFound("Account not found");
    const match = await user.comparePassword(currentPassword);
    if (!match) throw ApiError.badRequest("Current password is incorrect");
    user.password = newPassword;
    await user.save();
    await this.logoutAll(user._id);
    return { changed: true };
  },

  async verifyEmail(token) {
    let payload;
    try {
      payload = verifyVerifyToken(token);
    } catch {
      throw ApiError.badRequest("Verification link is invalid or has expired");
    }
    const user = await userRepository.findById(payload.sub);
    if (!user) throw ApiError.notFound("Account not found");
    if (user.isEmailVerified) return { verified: true, already: true };
    user.isEmailVerified = true;
    await user.save();
    return { verified: true };
  },

  async resendVerification(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("Account not found");
    if (user.isEmailVerified) return { sent: false, already: true };
    const link = await sendVerification(user);
    return { sent: true, verifyLink: env.isProd ? undefined : link };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId, {
      populate: [{ path: "bookmarks", select: "title slug excerpt featuredImage" }],
    });
    if (!user) throw ApiError.notFound("Account not found");
    return user.toSafeJSON();
  },

  async updateProfile(userId, data) {
    const update = {};
    if (data.name !== undefined) update.name = cleanText(data.name);
    if (data.avatar !== undefined) update.avatar = data.avatar;
    const user = await userRepository.updateById(userId, update);
    return user.toSafeJSON();
  },

  isPrivileged: (role) => role === ROLES.ADMIN || role === ROLES.EDITOR,
};

export default authService;
