import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { notificationService } from "../services/notification.service.js";

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const { items, unread, meta } = await notificationService.listForStaff(req.user, req.query);
    return ApiResponse.ok(res, items, "Notifications", { ...meta, unread });
  }),

  unreadCount: asyncHandler(async (req, res) => {
    const unread = await notificationService.unreadCount(req.user);
    return ApiResponse.ok(res, { unread }, "Unread count");
  }),

  markRead: asyncHandler(async (req, res) => {
    await notificationService.markRead(req.params.id, req.user);
    return ApiResponse.ok(res, null, "Marked read");
  }),

  markAllRead: asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user);
    return ApiResponse.ok(res, null, "All marked read");
  }),
};

export default notificationController;
