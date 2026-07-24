import { Router } from "express";
import { shayariController } from "../controllers/shayari.controller.js";
import { authenticate, optionalAuth, identifyVisitor } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createShayariSchema,
  updateShayariSchema,
  listShayariQuery,
  searchQuery,
  bulkActionSchema,
} from "../validators/shayari.validator.js";
import { ROLES } from "../constants/index.js";

const router = Router();

// Static/collection routes must precede the dynamic :slug route.
router.get("/", optionalAuth, validate(listShayariQuery), shayariController.list);
router.get("/trending", shayariController.trending);
router.get("/latest", shayariController.latest);
router.get("/random", shayariController.random);
router.get("/todays", shayariController.todays);
router.get("/search", validate(searchQuery), shayariController.search);
router.get("/suggest", shayariController.suggest);
router.get("/bookmarks/mine", optionalAuth, identifyVisitor(false), shayariController.myBookmarks);

// Authoring: any authenticated user can submit (their work is forced to a
// "pending" review state by the service); editors/admins publish directly.
router.post("/", authenticate, validate(createShayariSchema), shayariController.create);
router.post("/bulk", authenticate, authorize(ROLES.EDITOR, ROLES.ADMIN), validate(bulkActionSchema), shayariController.bulk);
router.put("/:id", authenticate, authorize(ROLES.EDITOR, ROLES.ADMIN), validate(updateShayariSchema), shayariController.update);
router.delete("/:id", authenticate, authorize(ROLES.EDITOR, ROLES.ADMIN), shayariController.remove);

// Engagement — works signed-in or anonymous (identifyVisitor mints a
// long-lived cookie for signed-out visitors so their toggle can be reversed).
router.post("/:id/like", optionalAuth, identifyVisitor(true), shayariController.like);
router.post("/:id/bookmark", optionalAuth, identifyVisitor(true), shayariController.bookmark);
router.post("/:id/share", shayariController.share);

// Public detail (last, so it doesn't shadow the routes above)
router.get("/:slug", optionalAuth, identifyVisitor(false), shayariController.getBySlug);

export default router;
