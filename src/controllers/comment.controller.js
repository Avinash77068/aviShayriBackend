import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { commentService } from "../services/comment.service.js";
import { recordAudit } from "../middlewares/audit.middleware.js";
import { AUDIT_ACTIONS } from "../constants/index.js";

export const commentController = {
  thread: asyncHandler(async (req, res) => {
    const data = await commentService.thread(req.params.shayariId, { viewer: req.user || null });
    return ApiResponse.ok(res, data, "Comments fetched");
  }),

  create: asyncHandler(async (req, res) => {
    const comment = await commentService.create(req.body, req.user);
    return ApiResponse.created(res, comment, "Comment posted");
  }),

  update: asyncHandler(async (req, res) => {
    const comment = await commentService.update(req.params.id, req.body.content, req.user);
    return ApiResponse.ok(res, comment, "Comment updated");
  }),

  remove: asyncHandler(async (req, res) => {
    await commentService.remove(req.params.id, req.user);
    return ApiResponse.ok(res, null, "Comment deleted");
  }),

  like: asyncHandler(async (req, res) => {
    const data = await commentService.toggleLike(req.params.id, req.user._id);
    return ApiResponse.ok(res, data, data.liked ? "Liked" : "Unliked");
  }),

  report: asyncHandler(async (req, res) => {
    const data = await commentService.report(req.params.id, req.user._id, req.body.reason);
    return ApiResponse.ok(res, data, "Comment reported");
  }),

  /* -------- Admin moderation -------- */
  moderationList: asyncHandler(async (req, res) => {
    const { items, meta } = await commentService.listForModeration(req.query);
    return ApiResponse.ok(res, items, "Comments for moderation", meta);
  }),

  moderate: asyncHandler(async (req, res) => {
    const comment = await commentService.moderate(req.params.id, req.body.status);
    recordAudit(req, { action: AUDIT_ACTIONS.UPDATE, entity: "Comment", entityId: req.params.id, description: `Moderated → ${req.body.status}` });
    return ApiResponse.ok(res, comment, "Comment moderated");
  }),
};

export default commentController;
