import BaseRepository from "./base.repository.js";
import {
  Ad,
  AuditLog,
  HomepageSection,
  Media,
  Reaction,
  SeoSettings,
  Notification,
} from "../models/index.js";

export { userRepository } from "./user.repository.js";
export { shayariRepository } from "./shayari.repository.js";
export { commentRepository } from "./comment.repository.js";
export {
  categoryRepository,
  tagRepository,
  authorRepository,
  languageRepository,
} from "./slugged.repository.js";

// Thin repositories for the remaining models.
export const adRepository = new BaseRepository(Ad);
export const mediaRepository = new BaseRepository(Media);
export const auditRepository = new BaseRepository(AuditLog);
export const reactionRepository = new BaseRepository(Reaction);
export const homepageRepository = new BaseRepository(HomepageSection);
export const seoRepository = new BaseRepository(SeoSettings);
export const notificationRepository = new BaseRepository(Notification);
