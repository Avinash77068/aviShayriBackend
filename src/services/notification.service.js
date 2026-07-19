import { Notification } from "../models/index.js";
import logger from "../config/logger.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

export const notificationService = {
  /** Create a staff-wide notification. Never throws into the caller's flow. */
  async notifyStaff({ type, title, message = "", link = "", actor = null, entity = "", entityId = "" }) {
    try {
      return await Notification.create({
        audience: "staff",
        type,
        title,
        message,
        link,
        actor,
        entity,
        entityId: String(entityId || ""),
      });
    } catch (err) {
      logger.warn(`[notify] failed: ${err.message}`);
      return null;
    }
  },

  /** List staff notifications for a viewer, annotating read state + unread count. */
  async listForStaff(viewer, query = {}) {
    const { page, limit, skip } = parsePagination({ ...query, limit: query.limit || 20 });
    const filter = { audience: "staff" };
    const [items, total, unread] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "actor", select: "name avatar" })
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, readBy: { $ne: viewer._id } }),
    ]);
    const annotated = items.map((n) => ({
      ...n,
      isRead: (n.readBy || []).some((u) => String(u) === String(viewer._id)),
    }));
    return { items: annotated, unread, meta: buildMeta(total, page, limit) };
  },

  async markRead(id, viewer) {
    await Notification.updateOne({ _id: id }, { $addToSet: { readBy: viewer._id } });
    return { read: true };
  },

  async markAllRead(viewer) {
    await Notification.updateMany({ audience: "staff" }, { $addToSet: { readBy: viewer._id } });
    return { read: true };
  },

  unreadCount(viewer) {
    return Notification.countDocuments({ audience: "staff", readBy: { $ne: viewer._id } });
  },
};

export default notificationService;
