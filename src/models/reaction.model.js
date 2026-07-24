import mongoose from "mongoose";
import { REACTION } from "../constants/index.js";

const { Schema, model } = mongoose;

/**
 * Tracks a single visitor's reaction (like/bookmark/share/view) on a shayari
 * so counters can't be inflated by repeat clicks. A signed-in visitor is
 * identified by `user`; a signed-out visitor by `anonId` (a long-lived cookie
 * value) — exactly one of the two is set per document. Two partial unique
 * indexes (scoped to whichever field is actually present) make "toggle like"
 * idempotent per (identity, shayari, type) for both cases.
 */
const reactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    anonId: { type: String, index: true },
    shayari: { type: Schema.Types.ObjectId, ref: "Shayari", required: true, index: true },
    type: { type: String, enum: Object.values(REACTION), required: true },
  },
  { timestamps: true }
);

reactionSchema.index(
  { user: 1, shayari: 1, type: 1 },
  { unique: true, partialFilterExpression: { user: { $type: "objectId" } } }
);
reactionSchema.index(
  { anonId: 1, shayari: 1, type: 1 },
  { unique: true, partialFilterExpression: { anonId: { $type: "string" } } }
);

const Reaction = model("Reaction", reactionSchema);
export default Reaction;
