import mongoose from "mongoose";

const { Schema, model } = mongoose;

const authorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    bio: { type: String, default: "", maxlength: 2000 },
    avatar: { type: String, default: "" },
    socialLinks: {
      website: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    shayariCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Author = model("Author", authorSchema);
export default Author;
