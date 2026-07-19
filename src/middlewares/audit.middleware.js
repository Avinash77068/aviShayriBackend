import { auditRepository } from "../repositories/index.js";
import logger from "../config/logger.js";

/**
 * Fire-and-forget audit logging. Call `recordAudit(req, {...})` from a service
 * or controller after a mutating action succeeds. Failures never break the request.
 */
export const recordAudit = async (req, { action, entity = "", entityId = "", description = "", metadata = {} }) => {
  try {
    await auditRepository.create({
      actor: req.user?._id,
      action,
      entity,
      entityId: String(entityId || ""),
      description,
      metadata,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
    });
  } catch (err) {
    logger.warn(`[audit] failed to record ${action} on ${entity}: ${err.message}`);
  }
};

/** Middleware factory that logs after a successful (2xx) response. */
export const auditAction = (action, entity, describe) => (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const description = typeof describe === "function" ? describe(req, res) : describe || "";
      recordAudit(req, { action, entity, entityId: req.params?.id, description });
    }
  });
  next();
};

export default recordAudit;
