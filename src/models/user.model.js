import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import { ROLES, USER_STATUS } from "../constants/index.js";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Shayari" }],
    likedShayari: [{ type: Schema.Types.ObjectId, ref: "Shayari" }],
    collections: [
      {
        name: { type: String, trim: true },
        slug: { type: String, trim: true },
        items: [{ type: Schema.Types.ObjectId, ref: "Shayari" }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    recentlyViewed: [
      {
        shayari: { type: Schema.Types.ObjectId, ref: "Shayari" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password whenever it is set/changed.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = model("User", userSchema);
export default User;
