import mongoose from "mongoose";

const { Schema, model } = mongoose;

const adSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slot: {
      type: String,
      required: true,
      enum: ["header", "sidebar", "in-feed", "footer", "detail-top", "detail-bottom"],
      index: true,
    },
    type: { type: String, enum: ["image", "html", "adsense"], default: "image" },
    image: { type: String, default: "" },
    link: { type: String, default: "" },
    html: { type: String, default: "" },
    adsenseSlotId: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Ad = model("Ad", adSchema);
export default Ad;
