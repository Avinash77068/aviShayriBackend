import mongoose from "mongoose";
import { AUDIT_ACTIONS } from "../constants/index.js";

const { Schema, model } = mongoose;

/**
 * Append-only audit trail for admin/editor actions and auth events.
 * A TTL index expires entries after 180 days to bound growth.
 */
const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true, index: true },
    entity: { type: String, default: "" }, // e.g. "Shayari"
    entityId: { type: String, default: "" },
    description: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

const AuditLog = model("AuditLog", auditLogSchema);
export default AuditLog;
