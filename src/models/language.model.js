import mongoose from "mongoose";

const { Schema, model } = mongoose;

const languageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Hindi"
    slug: { type: String, unique: true, sparse: true, lowercase: true, index: true },
    code: { type: String, required: true, unique: true, lowercase: true, trim: true }, // e.g. "hi"
    nativeName: { type: String, default: "" }, // e.g. "हिन्दी"
    direction: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Language = model("Language", languageSchema);
export default Language;
