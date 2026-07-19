import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";
import { ROLES } from "../constants/index.js";

const router = Router();

// Staff-only notification center.
router.use(authenticate, authorize(ROLES.EDITOR, ROLES.ADMIN));

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.post("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

export default router;
