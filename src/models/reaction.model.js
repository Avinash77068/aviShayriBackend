import mongoose from "mongoose";
import { REACTION } from "../constants/index.js";

const { Schema, model } = mongoose;

/**
 * Tracks a single user's reaction (like/bookmark/share/view) on a shayari so
 * counters can't be inflated by repeat clicks. A compound unique index makes
 * "toggle like" idempotent per (user, shayari, type).
 */
const reactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shayari: { type: Schema.Types.ObjectId, ref: "Shayari", required: true, index: true },
    type: { type: String, enum: Object.values(REACTION), required: true },
  },
  { timestamps: true }
);

reactionSchema.index({ user: 1, shayari: 1, type: 1 }, { unique: true });

const Reaction = model("Reaction", reactionSchema);
export default Reaction;
