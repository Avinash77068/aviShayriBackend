import mongoose from "mongoose";

const { Schema, model } = mongoose;

const tagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: "" },
    usageCount: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const Tag = model("Tag", tagSchema);
export default Tag;
