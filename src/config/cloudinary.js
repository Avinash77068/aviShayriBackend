import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";
import logger from "./logger.js";

if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  logger.info("Cloudinary configured");
} else {
  logger.warn("Cloudinary not configured — image uploads will use local disk fallback");
}

export default cloudinary;
