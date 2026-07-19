import { Shayari, Category, SeoSettings } from "../models/index.js";
import { STATUS } from "../constants/index.js";

const escapeXml = (s = "") =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

export const seoFeedService = {
  async robots() {
    const settings = await SeoSettings.getSingleton();
    return settings.robotsTxt.replace(
      "Sitemap: /sitemap.xml",
      `Sitemap: ${settings.siteUrl}/sitemap.xml`
    );
  },

  /** XML sitemap of published shayari + categories + static pages. */
  async sitemap() {
    const settings = await SeoSettings.getSingleton();
    const base = settings.siteUrl.replace(/\/$/, "");

    const [shayari, categories] = await Promise.all([
      Shayari.find({ status: STATUS.PUBLISHED }).select("slug updatedAt").sort({ updatedAt: -1 }).limit(5000).lean(),
      Category.find({ isActive: true }).select("slug updatedAt").lean(),
    ]);

    const urls = [
      { loc: base, priority: "1.0", changefreq: "daily" },
      { loc: `${base}/trending`, priority: "0.8", changefreq: "daily" },
      { loc: `${base}/categories`, priority: "0.7", changefreq: "weekly" },
      ...categories.map((c) => ({
        loc: `${base}/category/${c.slug}`,
        lastmod: c.updatedAt,
        priority: "0.7",
        changefreq: "weekly",
      })),
      ...shayari.map((s) => ({
        loc: `${base}/shayari/${s.slug}`,
        lastmod: s.updatedAt,
        priority: "0.6",
        changefreq: "weekly",
      })),
    ];

    const body = urls
      .map(
        (u) =>
          `  <url><loc>${escapeXml(u.loc)}</loc>${
            u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""
          }<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
  },

  /** RSS 2.0 feed of the latest published shayari. */
  async rss() {
    const settings = await SeoSettings.getSingleton();
    const base = settings.siteUrl.replace(/\/$/, "");
    const items = await Shayari.find({ status: STATUS.PUBLISHED })
      .sort({ publishedAt: -1 })
      .limit(50)
      .populate({ path: "author", select: "name" })
      .lean();

    const entries = items
      .map(
        (s) => `    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${base}/shayari/${s.slug}</link>
      <guid isPermaLink="true">${base}/shayari/${s.slug}</guid>
      <description>${escapeXml(s.excerpt || "")}</description>
      ${s.author ? `<author>${escapeXml(s.author.name)}</author>` : ""}
      <pubDate>${new Date(s.publishedAt || s.createdAt).toUTCString()}</pubDate>
    </item>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(settings.siteName)}</title>
    <link>${base}</link>
    <description>${escapeXml(settings.defaultDescription || settings.defaultTitle)}</description>
    <language>en</language>
${entries}
  </channel>
</rss>`;
  },
};

export default seoFeedService;
