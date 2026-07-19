import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.get("/verify-email", authController.verifyEmail);
router.post("/verify-email", authController.verifyEmail);

// Authenticated
router.use(authenticate);
router.post("/logout-all", authController.logoutAll);
router.post("/resend-verification", authController.resendVerification);
router.post("/change-password", validate(changePasswordSchema), authController.changePassword);
router.get("/profile", authController.profile);
router.put("/profile", validate(updateProfileSchema), authController.updateProfile);

export default router;
