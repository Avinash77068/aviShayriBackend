import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Global site-wide SEO / branding settings. Intended to be a single document
 * (singleton). Fetched via `SeoSettings.getSingleton()`.
 */
const seoSettingsSchema = new Schema(
  {
    siteName: { type: String, default: "Shayari" },
    siteUrl: { type: String, default: "http://localhost:3000" },
    defaultTitle: { type: String, default: "Shayari — where words find their rhythm" },
    titleTemplate: { type: String, default: "%s | Shayari" },
    defaultDescription: { type: String, default: "" },
    defaultKeywords: [{ type: String }],
    defaultOgImage: { type: String, default: "" },
    twitterHandle: { type: String, default: "" },
    organization: {
      name: { type: String, default: "Shayari" },
      logo: { type: String, default: "" },
      sameAs: [{ type: String }],
    },
    robotsTxt: {
      type: String,
      default: "User-agent: *\nAllow: /\nSitemap: /sitemap.xml",
    },
    googleVerification: { type: String, default: "" },
    analyticsId: { type: String, default: "" },
  },
  { timestamps: true }
);

seoSettingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

const SeoSettings = model("SeoSettings", seoSettingsSchema);
export default SeoSettings;
