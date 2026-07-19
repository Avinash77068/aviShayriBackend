import mongoose from "mongoose";
import { STATUS } from "../constants/index.js";

const { Schema, model } = mongoose;

const shayariSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    content: { type: String, required: true }, // sanitized rich text
    excerpt: { type: String, default: "", maxlength: 320 },
    language: { type: Schema.Types.ObjectId, ref: "Language", index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag", index: true }],
    author: { type: Schema.Types.ObjectId, ref: "Author", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },

    featuredImage: { type: String, default: "" },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.DRAFT,
      index: true,
    },
    publishedAt: { type: Date, default: null },

    // Engagement counters (denormalized for fast reads).
    likes: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0, index: true },
    shares: { type: Number, default: 0, min: 0 },
    bookmarks: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },

    // Popularity score maintained by a cron for trending computation.
    popularityScore: { type: Number, default: 0, index: true },

    readingTime: { type: Number, default: 1 }, // minutes

    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Full-text search across the fields users actually search by.
// `language_override` is set to a non-existent field so MongoDB does NOT treat
// our `language` (an ObjectId ref) as the text-index language string — that
// collision otherwise throws "language override field ... non-string type".
// `default_language: "none"` disables stemming/stop-words, which suits
// transliterated multilingual (Hindi/Urdu) content better than English rules.
shayariSchema.index(
  { title: "text", content: "text", excerpt: "text" },
  {
    weights: { title: 5, excerpt: 2, content: 1 },
    name: "shayari_text",
    default_language: "none",
    language_override: "textLang",
  }
);

// Common listing sort: newest published first.
shayariSchema.index({ status: 1, publishedAt: -1 });

shayariSchema.virtual("url").get(function url() {
  return `/shayari/${this.slug}`;
});

const Shayari = model("Shayari", shayariSchema);
export default Shayari;
