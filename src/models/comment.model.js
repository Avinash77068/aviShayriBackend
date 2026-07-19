import mongoose from "mongoose";
import { COMMENT_STATUS } from "../constants/index.js";

const { Schema, model } = mongoose;

/**
 * Nested comments via a self-referential `parent` pointer. `path` stores the
 * ancestor chain so a full thread can be fetched and rebuilt in one query.
 */
const commentSchema = new Schema(
  {
    shayari: { type: Schema.Types.ObjectId, ref: "Shayari", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
    path: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    depth: { type: Number, default: 0 },

    status: {
      type: String,
      enum: Object.values(COMMENT_STATUS),
      default: COMMENT_STATUS.APPROVED,
      index: true,
    },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],

    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },

    reports: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        reason: { type: String, maxlength: 300 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    reportCount: { type: Number, default: 0, index: true },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ shayari: 1, parent: 1, createdAt: 1 });

const Comment = model("Comment", commentSchema);
export default Comment;
