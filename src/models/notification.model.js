import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../constants/index.js";

const { Schema, model } = mongoose;

/**
 * Staff-facing notifications (e.g. "a user submitted a shayari for review").
 * `audience: "staff"` targets all admins/editors; a specific `recipient` can
 * also be set for per-user notifications later.
 */
const notificationSchema = new Schema(
  {
    audience: { type: String, enum: ["staff", "user"], default: "staff", index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPES), required: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    actor: { type: Schema.Types.ObjectId, ref: "User" },
    entity: { type: String, default: "" },
    entityId: { type: String, default: "" },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }], // for shared staff notifications
    isRead: { type: Boolean, default: false }, // for single-recipient notifications
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });
// Auto-expire after 60 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

const Notification = model("Notification", notificationSchema);
export default Notification;
