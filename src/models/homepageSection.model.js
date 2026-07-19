import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Configurable homepage sections rendered by the client in `order`. Each
 * section declares a `type` the frontend knows how to render and optional
 * query params (category, tag, limit) for dynamic content.
 */
const homepageSectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    type: {
      type: String,
      enum: ["hero", "trending", "latest", "featured", "category", "tag", "random", "editorial", "custom"],
      required: true,
    },
    layout: { type: String, enum: ["grid", "carousel", "masonry", "list"], default: "grid" },
    query: {
      category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
      tag: { type: Schema.Types.ObjectId, ref: "Tag", default: null },
      limit: { type: Number, default: 8 },
    },
    items: [{ type: Schema.Types.ObjectId, ref: "Shayari" }], // for curated/custom
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const HomepageSection = model("HomepageSection", homepageSectionSchema);
export default HomepageSection;
