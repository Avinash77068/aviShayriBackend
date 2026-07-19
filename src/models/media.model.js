import mongoose from "mongoose";

const { Schema, model } = mongoose;

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" }, // Cloudinary public_id (for deletion)
    provider: { type: String, enum: ["cloudinary", "local"], default: "local" },
    filename: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    alt: { type: String, default: "" },
    folder: { type: String, default: "shayari" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

const Media = model("Media", mediaSchema);
export default Media;
