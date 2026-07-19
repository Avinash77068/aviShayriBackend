import mongoose from "mongoose";

const { Schema, model } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: "", maxlength: 1000 },
    icon: { type: String, default: "" },
    image: { type: String, default: "" },
    color: { type: String, default: "#7c3aed" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    shayariCount: { type: Number, default: 0 },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: [{ type: String }],
  },
  { timestamps: true }
);

const Category = model("Category", categorySchema);
export default Category;
