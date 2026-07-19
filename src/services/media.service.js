import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import env from "../config/env.js";
import { mediaRepository } from "../repositories/index.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

export const mediaService = {
  /** Persist metadata for a file already uploaded by multer (Cloudinary or disk). */
  async saveUploaded(file, userId) {
    if (!file) throw ApiError.badRequest("No file uploaded");
    const isCloud = env.cloudinary.enabled;
    const doc = await mediaRepository.create({
      url: isCloud ? file.path : `/uploads/${file.filename}`,
      publicId: isCloud ? file.filename : "",
      provider: isCloud ? "cloudinary" : "local",
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      width: file.width || 0,
      height: file.height || 0,
      uploadedBy: userId,
      folder: env.cloudinary.folder,
    });
    return doc;
  },

  async list(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await mediaRepository.paginate(
      {},
      { page, limit, skip, sort: { createdAt: -1 } }
    );
    return { items, meta: buildMeta(total, page, limit) };
  },

  async remove(id) {
    const media = await mediaRepository.findById(id);
    if (!media) throw ApiError.notFound("Media not found");
    if (media.provider === "cloudinary" && media.publicId) {
      try {
        await cloudinary.uploader.destroy(media.publicId);
      } catch {
        /* ignore remote deletion failures — still remove the record */
      }
    }
    await mediaRepository.deleteById(id);
    return { deleted: true };
  },
};

export default mediaService;
