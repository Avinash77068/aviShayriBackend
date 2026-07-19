import { Router } from "express";
import { commentController } from "../controllers/comment.controller.js";
import { authenticate, optionalAuth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createCommentSchema,
  updateCommentSchema,
  reportCommentSchema,
  moderateCommentSchema,
} from "../validators/content.validator.js";
import { ROLES } from "../constants/index.js";

const router = Router();

// Admin moderation (declare before dynamic params).
router.get("/moderation", authenticate, authorize(ROLES.EDITOR, ROLES.ADMIN), commentController.moderationList);
router.patch("/:id/moderate", authenticate, authorize(ROLES.EDITOR, ROLES.ADMIN), validate(moderateCommentSchema), commentController.moderate);

// Public read of a shayari's thread.
router.get("/shayari/:shayariId", optionalAuth, commentController.thread);

// Authenticated actions.
router.post("/", authenticate, validate(createCommentSchema), commentController.create);
router.put("/:id", authenticate, validate(updateCommentSchema), commentController.update);
router.delete("/:id", authenticate, commentController.remove);
router.post("/:id/like", authenticate, commentController.like);
router.post("/:id/report", authenticate, validate(reportCommentSchema), commentController.report);

export default router;
