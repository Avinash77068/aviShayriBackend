import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");

const fileFilter = (_req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/.test(file.mimetype)) return cb(null, true);
  return cb(ApiError.badRequest("Only image files are allowed"), false);
};

let storage;
if (env.cloudinary.enabled) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: env.cloudinary.folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
  });
} else {
  // Local disk fallback so uploads still work without Cloudinary in dev.
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, "-").toLowerCase();
      cb(null, `${base}-${Date.now()}${ext}`);
    },
  });
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export { uploadDir };
export default upload;
