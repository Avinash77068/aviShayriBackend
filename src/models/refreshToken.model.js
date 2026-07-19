import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Refresh tokens are stored hashed (sha256) so a DB leak cannot be used to
 * mint access tokens. Rotation revokes the old token and links the new one.
 * A TTL index auto-purges expired documents.
 */
const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.methods.isActive = function isActive() {
  return !this.revokedAt && this.expiresAt > new Date();
};

const RefreshToken = model("RefreshToken", refreshTokenSchema);
export default RefreshToken;
