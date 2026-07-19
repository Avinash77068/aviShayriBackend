import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import env from "../config/env.js";
import { authService } from "../services/auth.service.js";
import { setAuthCookies, clearAuthCookies } from "../helpers/cookie.js";
import { recordAudit } from "../middlewares/audit.middleware.js";
import { AUDIT_ACTIONS } from "../constants/index.js";

const ctx = (req) => ({ userAgent: req.headers["user-agent"] || "", ip: req.ip });

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, ctx(req));
    setAuthCookies(res, result);
    return ApiResponse.created(
      res,
      { user: result.user, accessToken: result.accessToken, verifyLink: result.verifyLink },
      "Registration successful"
    );
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, ctx(req));
    setAuthCookies(res, result);
    recordAudit(req, { action: AUDIT_ACTIONS.LOGIN, entity: "User", entityId: result.user._id, description: "User logged in" });
    return ApiResponse.ok(res, { user: result.user, accessToken: result.accessToken }, "Login successful");
  }),

  refresh: asyncHandler(async (req, res) => {
    const raw = req.cookies?.[env.cookie.refreshName] || req.body?.refreshToken;
    const result = await authService.refresh(raw, ctx(req));
    setAuthCookies(res, result);
    return ApiResponse.ok(res, { user: result.user, accessToken: result.accessToken }, "Token refreshed");
  }),

  logout: asyncHandler(async (req, res) => {
    const raw = req.cookies?.[env.cookie.refreshName];
    await authService.logout(raw);
    clearAuthCookies(res);
    return ApiResponse.ok(res, null, "Logged out");
  }),

  logoutAll: asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user._id);
    clearAuthCookies(res);
    return ApiResponse.ok(res, null, "Logged out from all devices");
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    return ApiResponse.ok(res, result, "If that email exists, a reset link has been sent");
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password);
    clearAuthCookies(res);
    return ApiResponse.ok(res, null, "Password has been reset — please log in");
  }),

  changePassword: asyncHandler(async (req, res) => {
    await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
    clearAuthCookies(res);
    return ApiResponse.ok(res, null, "Password changed — please log in again");
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const token = req.query.token || req.body.token;
    const result = await authService.verifyEmail(token);
    return ApiResponse.ok(res, result, "Email verified");
  }),

  resendVerification: asyncHandler(async (req, res) => {
    const result = await authService.resendVerification(req.user._id);
    return ApiResponse.ok(res, result, "Verification email sent");
  }),

  profile: asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user._id);
    return ApiResponse.ok(res, { user }, "Profile fetched");
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user._id, req.body);
    return ApiResponse.ok(res, { user }, "Profile updated");
  }),
};

export default authController;
