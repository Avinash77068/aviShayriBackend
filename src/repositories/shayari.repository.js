import BaseRepository from "./base.repository.js";
import { Shayari } from "../models/index.js";

const DETAIL_POPULATE = [
  { path: "category", select: "name slug color icon" },
  { path: "tags", select: "name slug" },
  { path: "author", select: "name slug avatar" },
  // The submitting user — shown as the author when no dedicated poet is set.
  { path: "createdBy", select: "name avatar" },
  { path: "language", select: "name code nativeName direction" },
];

class ShayariRepository extends BaseRepository {
  constructor() {
    super(Shayari);
  }

  slugExists(slug, ignoreId = null) {
    const filter = { slug };
    if (ignoreId) filter._id = { $ne: ignoreId };
    return this.model.exists(filter);
  }

  findBySlug(slug, { publishedOnly = false } = {}) {
    const filter = { slug };
    if (publishedOnly) filter.status = "published";
    return this.findOne(filter, { populate: DETAIL_POPULATE });
  }

  listPublished(filter, pagination) {
    return this.paginate(
      { ...filter, status: "published" },
      { ...pagination, populate: DETAIL_POPULATE }
    );
  }

  /** Atomic counter increment (likes/views/shares/bookmarks/commentCount). */
  incrementCounter(id, field, by = 1) {
    return this.model.findByIdAndUpdate(id, { $inc: { [field]: by } }, { new: true });
  }

  /** Text search using the compound text index, sorted by relevance. */
  search(term, { skip = 0, limit = 12, extraFilter = {} } = {}) {
    const filter = { $text: { $search: term }, status: "published", ...extraFilter };
    return Promise.all([
      this.model
        .find(filter, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit)
        .populate(DETAIL_POPULATE)
        .lean(),
      this.model.countDocuments(filter),
    ]).then(([items, total]) => ({ items, total }));
  }

  random(count = 1, filter = {}) {
    return this.model.aggregate([
      { $match: { status: "published", ...filter } },
      { $sample: { size: count } },
    ]);
  }

  /** Related by shared category/tags, excluding the source doc. */
  related(shayari, limit = 6) {
    return this.model
      .find({
        _id: { $ne: shayari._id },
        status: "published",
        $or: [{ category: shayari.category }, { tags: { $in: shayari.tags || [] } }],
      })
      .sort({ popularityScore: -1, publishedAt: -1 })
      .limit(limit)
      .populate(DETAIL_POPULATE)
      .lean();
  }
}

export const shayariRepository = new ShayariRepository();
export { DETAIL_POPULATE };
export default shayariRepository;
