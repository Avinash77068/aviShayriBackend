import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { userService } from "../services/user.service.js";
import { recordAudit } from "../middlewares/audit.middleware.js";
import { AUDIT_ACTIONS } from "../constants/index.js";

export const userController = {
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await userService.list(req.query);
    return ApiResponse.ok(res, items, "Users fetched", meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.id);
    return ApiResponse.ok(res, user, "User fetched");
  }),

  update: asyncHandler(async (req, res) => {
    const user = await userService.adminUpdate(req.params.id, req.body, req.user);
    recordAudit(req, { action: AUDIT_ACTIONS.UPDATE, entity: "User", entityId: req.params.id, description: "Admin updated user" });
    return ApiResponse.ok(res, user, "User updated");
  }),

  remove: asyncHandler(async (req, res) => {
    await userService.remove(req.params.id, req.user);
    recordAudit(req, { action: AUDIT_ACTIONS.DELETE, entity: "User", entityId: req.params.id, description: "Admin deleted user" });
    return ApiResponse.ok(res, null, "User deleted");
  }),

  /* -------- Self-service library -------- */
  myBookmarks: asyncHandler(async (req, res) => {
    const { items, meta } = await userService.bookmarks(req.user._id, req.query);
    return ApiResponse.ok(res, items, "Bookmarks", meta);
  }),

  myRecentlyViewed: asyncHandler(async (req, res) => {
    const data = await userService.recentlyViewed(req.user._id);
    return ApiResponse.ok(res, data, "Recently viewed");
  }),

  createCollection: asyncHandler(async (req, res) => {
    const data = await userService.createCollection(req.user._id, req.body.name);
    return ApiResponse.created(res, data, "Collection created");
  }),

  addToCollection: asyncHandler(async (req, res) => {
    const data = await userService.addToCollection(req.user._id, req.params.collectionId, req.body.shayariId);
    return ApiResponse.ok(res, data, "Added to collection");
  }),
};

export default userController;
