import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { adminUpdateUserSchema } from "../validators/content.validator.js";
import { ROLES } from "../constants/index.js";

const router = Router();
router.use(authenticate);

// Self-service library (any authenticated user).
router.get("/me/bookmarks", userController.myBookmarks);
router.get("/me/recently-viewed", userController.myRecentlyViewed);
router.post("/me/collections", userController.createCollection);
router.post("/me/collections/:collectionId/items", userController.addToCollection);

// Admin user management.
router.get("/", authorize(ROLES.ADMIN), userController.list);
router.get("/:id", authorize(ROLES.ADMIN), userController.getById);
router.put("/:id", authorize(ROLES.ADMIN), validate(adminUpdateUserSchema), userController.update);
router.delete("/:id", authorize(ROLES.ADMIN), userController.remove);

export default router;
