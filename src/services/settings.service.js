import ApiError from "../utils/ApiError.js";
import { Ad, HomepageSection, SeoSettings } from "../models/index.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

/* -------- Ads -------- */
export const adService = {
  async listActive(slot) {
    const now = new Date();
    const filter = {
      isActive: true,
      $and: [
        { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
        { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
      ],
    };
    if (slot) filter.slot = slot;
    return Ad.find(filter).lean();
  },
  async adminList(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      Ad.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Ad.countDocuments(),
    ]);
    return { items, meta: buildMeta(total, page, limit) };
  },
  create: (body) => Ad.create(body),
  async update(id, body) {
    const ad = await Ad.findByIdAndUpdate(id, body, { new: true });
    if (!ad) throw ApiError.notFound("Ad not found");
    return ad;
  },
  async remove(id) {
    const ad = await Ad.findByIdAndDelete(id);
    if (!ad) throw ApiError.notFound("Ad not found");
    return { deleted: true };
  },
  recordImpression: (id) => Ad.findByIdAndUpdate(id, { $inc: { impressions: 1 } }),
  recordClick: (id) => Ad.findByIdAndUpdate(id, { $inc: { clicks: 1 } }),
};

/* -------- Homepage sections -------- */
export const homepageService = {
  async publicLayout() {
    const sections = await HomepageSection.find({ isActive: true })
      .sort({ order: 1 })
      .populate([
        { path: "query.category", select: "name slug" },
        { path: "query.tag", select: "name slug" },
        { path: "items", select: "title slug excerpt featuredImage" },
      ])
      .lean();
    return sections;
  },
  adminList: () => HomepageSection.find().sort({ order: 1 }).lean(),
  create: (body) => HomepageSection.create(body),
  async update(id, body) {
    const s = await HomepageSection.findByIdAndUpdate(id, body, { new: true });
    if (!s) throw ApiError.notFound("Section not found");
    return s;
  },
  async remove(id) {
    const s = await HomepageSection.findByIdAndDelete(id);
    if (!s) throw ApiError.notFound("Section not found");
    return { deleted: true };
  },
  async reorder(order = []) {
    // order: [{ id, order }]
    await Promise.all(order.map(({ id, order: o }) => HomepageSection.findByIdAndUpdate(id, { order: o })));
    return this.adminList();
  },
};

/* -------- SEO settings (singleton) -------- */
export const seoService = {
  get: () => SeoSettings.getSingleton(),
  async update(body) {
    const doc = await SeoSettings.getSingleton();
    Object.assign(doc, body);
    await doc.save();
    return doc;
  },
};
