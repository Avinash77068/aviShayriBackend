import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { shayariService } from "../services/shayari.service.js";
import { recordAudit } from "../middlewares/audit.middleware.js";
import { AUDIT_ACTIONS, REACTION } from "../constants/index.js";
import { authService } from "../services/auth.service.js";

export const shayariController = {
  // Public listing — only published unless caller is admin/editor and asks.
  list: asyncHandler(async (req, res) => {
    const includeDrafts = req.user && authService.isPrivileged(req.user.role) && req.query.admin === "true";
    const { items, meta } = await shayariService.list(req.query, { includeDrafts });
    return ApiResponse.ok(res, items, "Shayari fetched", meta);
  }),

  trending: asyncHandler(async (req, res) => {
    const data = await shayariService.trending(Number(req.query.limit) || 12);
    return ApiResponse.ok(res, data, "Trending shayari");
  }),

  latest: asyncHandler(async (req, res) => {
    const data = await shayariService.latest(Number(req.query.limit) || 12);
    return ApiResponse.ok(res, data, "Latest shayari");
  }),

  random: asyncHandler(async (req, res) => {
    const data = await shayariService.random(Number(req.query.count) || 1);
    return ApiResponse.ok(res, data, "Random shayari");
  }),

  todays: asyncHandler(async (_req, res) => {
    const data = await shayariService.todays();
    // The pick is stable for the whole day, so cache it at the CDN edge —
    // repeat visits get served without re-running the count+skip query.
    res.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=1800");
    return ApiResponse.ok(res, data, "Today's shayari");
  }),

  search: asyncHandler(async (req, res) => {
    const { items, meta } = await shayariService.search(req.query.q, req.query);
    return ApiResponse.ok(res, items, "Search results", meta);
  }),

  suggest: asyncHandler(async (req, res) => {
    const data = await shayariService.suggest(req.query.q, Number(req.query.limit) || 6);
    return ApiResponse.ok(res, data, "Suggestions");
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const data = await shayariService.getBySlug(req.params.slug, { user: req.user || null });
    return ApiResponse.ok(res, data, "Shayari fetched");
  }),

  create: asyncHandler(async (req, res) => {
    const shayari = await shayariService.create(req.body, req.user);
    recordAudit(req, { action: AUDIT_ACTIONS.CREATE, entity: "Shayari", entityId: shayari._id, description: `Created "${shayari.title}"` });
    const message =
      shayari.status === "pending"
        ? "Submitted for review — an admin will approve it before it goes live"
        : "Shayari created";
    return ApiResponse.created(res, shayari, message);
  }),

  update: asyncHandler(async (req, res) => {
    const shayari = await shayariService.update(req.params.id, req.body);
    recordAudit(req, { action: AUDIT_ACTIONS.UPDATE, entity: "Shayari", entityId: req.params.id, description: `Updated "${shayari.title}"` });
    return ApiResponse.ok(res, shayari, "Shayari updated");
  }),

  remove: asyncHandler(async (req, res) => {
    await shayariService.remove(req.params.id);
    recordAudit(req, { action: AUDIT_ACTIONS.DELETE, entity: "Shayari", entityId: req.params.id, description: "Deleted shayari" });
    return ApiResponse.ok(res, null, "Shayari deleted");
  }),

  bulk: asyncHandler(async (req, res) => {
    const result = await shayariService.bulkAction(req.body.ids, req.body.action);
    recordAudit(req, { action: AUDIT_ACTIONS.BULK, entity: "Shayari", description: `Bulk ${req.body.action} on ${result.affected} items` });
    return ApiResponse.ok(res, result, `Bulk ${req.body.action} complete`);
  }),

  /* -------- Engagement -------- */
  like: asyncHandler(async (req, res) => {
    const data = await shayariService.toggleReaction(req.params.id, req.user._id, REACTION.LIKE);
    return ApiResponse.ok(res, data, data.active ? "Liked" : "Unliked");
  }),

  bookmark: asyncHandler(async (req, res) => {
    const data = await shayariService.toggleReaction(req.params.id, req.user._id, REACTION.BOOKMARK);
    return ApiResponse.ok(res, data, data.active ? "Bookmarked" : "Removed bookmark");
  }),

  share: asyncHandler(async (req, res) => {
    const data = await shayariService.recordShare(req.params.id);
    return ApiResponse.ok(res, data, "Share recorded");
  }),
};

export default shayariController;
