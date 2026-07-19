import ApiError from "../utils/ApiError.js";
import {
  shayariRepository,
  categoryRepository,
  tagRepository,
  reactionRepository,
  userRepository,
} from "../repositories/index.js";
import { Shayari, Author, Tag, Category } from "../models/index.js";
import { uniqueSlug } from "../utils/slug.js";
import { parsePagination, buildMeta, parseSort } from "../utils/pagination.js";
import { calcReadingTime } from "../utils/readingTime.js";
import { cleanRichText, cleanText } from "../helpers/sanitize.js";
import { STATUS, REACTION, ROLES, NOTIFICATION_TYPES } from "../constants/index.js";
import { notificationService } from "./notification.service.js";

/** Resolve category/tag/author/language filters that may arrive as slug or id. */
const resolveFilters = async (query = {}) => {
  const filter = {};
  if (query.category) {
    const cat = await categoryRepository.findOne({
      $or: [{ slug: query.category }, { _id: query.category.match(/^[a-f\d]{24}$/i) ? query.category : null }],
    });
    if (cat) filter.category = cat._id;
    else filter.category = null; // no match → empty result
  }
  if (query.tag) {
    const tag = await tagRepository.findOne({ slug: query.tag });
    filter.tags = tag ? tag._id : null;
  }
  if (query.language) filter.language = query.language.match(/^[a-f\d]{24}$/i) ? query.language : undefined;
  if (query.author) filter.author = query.author.match(/^[a-f\d]{24}$/i) ? query.author : undefined;
  if (query.featured) filter.featured = query.featured === "true";
  if (query.trending) filter.trending = query.trending === "true";
  return filter;
};

const buildContent = (body) => {
  const content = cleanRichText(body.content);
  return {
    content,
    excerpt: body.excerpt ? cleanText(body.excerpt) : cleanText(content).slice(0, 200),
    readingTime: calcReadingTime(content),
  };
};

/** Keep denormalized counters (category.shayariCount, tag.usageCount) accurate. */
const bumpTagUsage = async (tagIds = [], delta = 1) => {
  if (tagIds.length) await Tag.updateMany({ _id: { $in: tagIds } }, { $inc: { usageCount: delta } });
};

export const shayariService = {
  async list(query, { includeDrafts = false } = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = await resolveFilters(query);

    if (includeDrafts) {
      if (query.status) filter.status = query.status;
    } else {
      filter.status = STATUS.PUBLISHED;
    }

    if (query.search) filter.$text = { $search: query.search };

    const sort = query.search
      ? { score: { $meta: "textScore" } }
      : parseSort(query.sort, { publishedAt: -1, createdAt: -1 });

    const { items, total } = await shayariRepository.paginate(filter, {
      page,
      limit,
      skip,
      sort,
      populate: [
        { path: "category", select: "name slug color icon" },
        { path: "tags", select: "name slug" },
        { path: "author", select: "name slug avatar" },
        { path: "language", select: "name code nativeName" },
      ],
    });
    return { items, meta: buildMeta(total, page, limit) };
  },

  async getBySlug(slug, { user = null, publishedOnly = true } = {}) {
    const shayari = await shayariRepository.findBySlug(slug, { publishedOnly });
    if (!shayari) throw ApiError.notFound("Shayari not found");

    // Count a view (fire and forget) and track recently viewed for logged-in users.
    shayariRepository.incrementCounter(shayari._id, "views").catch(() => {});
    if (user) {
      userRepository
        .updateById(user._id, {
          $pull: { recentlyViewed: { shayari: shayari._id } },
        })
        .then(() =>
          userRepository.updateById(user._id, {
            $push: {
              recentlyViewed: { $each: [{ shayari: shayari._id, viewedAt: new Date() }], $position: 0, $slice: 30 },
            },
          })
        )
        .catch(() => {});
    }

    const related = await shayariRepository.related(shayari, 6);
    const obj = shayari.toObject();
    obj.views += 1;

    if (user) {
      const reactions = await reactionRepository.find({ user: user._id, shayari: shayari._id });
      obj.isLiked = reactions.some((r) => r.type === REACTION.LIKE);
      obj.isBookmarked = reactions.some((r) => r.type === REACTION.BOOKMARK);
    }
    return { shayari: obj, related };
  },

  async create(body, actor) {
    const category = await Category.findById(body.category);
    if (!category) throw ApiError.badRequest("Category does not exist");

    const isStaff = actor?.role === ROLES.ADMIN || actor?.role === ROLES.EDITOR;
    // Regular users may submit, but their work is queued for review — it can
    // never go live without staff approval, regardless of what they request.
    const status = isStaff ? body.status || STATUS.DRAFT : STATUS.PENDING;

    const slug = await uniqueSlug(body.title, (s) => shayariRepository.slugExists(s));
    const { content, excerpt, readingTime } = buildContent(body);

    const shayari = await shayariRepository.create({
      ...body,
      // Users can't self-promote their submissions.
      featured: isStaff ? body.featured : false,
      trending: isStaff ? body.trending : false,
      title: cleanText(body.title),
      slug,
      content,
      excerpt,
      readingTime,
      status,
      publishedAt: status === STATUS.PUBLISHED ? new Date() : null,
      createdBy: actor?._id,
    });

    await Promise.all([
      Category.findByIdAndUpdate(category._id, { $inc: { shayariCount: 1 } }),
      bumpTagUsage(body.tags, 1),
      body.author ? Author.findByIdAndUpdate(body.author, { $inc: { shayariCount: 1 } }) : null,
    ]);

    // Notify staff when a regular user submits something for review.
    if (!isStaff) {
      await notificationService.notifyStaff({
        type: NOTIFICATION_TYPES.SHAYARI_SUBMISSION,
        title: "New shayari submitted for review",
        message: `${actor?.name || "A user"} submitted “${cleanText(body.title)}”`,
        link: "/admin/submissions",
        actor: actor?._id,
        entity: "Shayari",
        entityId: shayari._id,
      });
    }

    return shayariRepository.findById(shayari._id, {
      populate: [{ path: "category", select: "name slug" }, { path: "tags", select: "name slug" }],
    });
  },

  async update(id, body) {
    const existing = await Shayari.findById(id);
    if (!existing) throw ApiError.notFound("Shayari not found");

    const update = { ...body };
    if (body.title && body.title !== existing.title) {
      update.title = cleanText(body.title);
      update.slug = await uniqueSlug(body.title, (s) => shayariRepository.slugExists(s), { ignoreId: id });
    }
    if (body.content !== undefined) {
      const built = buildContent(body);
      update.content = built.content;
      update.excerpt = body.excerpt ? cleanText(body.excerpt) : built.excerpt;
      update.readingTime = built.readingTime;
    }
    // Publish transition stamps publishedAt once.
    if (body.status === STATUS.PUBLISHED && existing.status !== STATUS.PUBLISHED) {
      update.publishedAt = new Date();
    }

    // Reconcile category/tag counters if they changed.
    if (body.category && String(body.category) !== String(existing.category)) {
      await Promise.all([
        Category.findByIdAndUpdate(existing.category, { $inc: { shayariCount: -1 } }),
        Category.findByIdAndUpdate(body.category, { $inc: { shayariCount: 1 } }),
      ]);
    }
    if (body.tags) {
      const before = (existing.tags || []).map(String);
      const after = body.tags.map(String);
      await bumpTagUsage(after.filter((t) => !before.includes(t)), 1);
      await bumpTagUsage(before.filter((t) => !after.includes(t)), -1);
    }

    return shayariRepository.updateById(id, update, { new: true, runValidators: true });
  },

  async remove(id) {
    const shayari = await Shayari.findById(id);
    if (!shayari) throw ApiError.notFound("Shayari not found");
    await Promise.all([
      Category.findByIdAndUpdate(shayari.category, { $inc: { shayariCount: -1 } }),
      bumpTagUsage(shayari.tags, -1),
      shayari.author ? Author.findByIdAndUpdate(shayari.author, { $inc: { shayariCount: -1 } }) : null,
      reactionRepository.deleteMany({ shayari: id }),
    ]);
    await shayariRepository.deleteById(id);
    return { deleted: true };
  },

  async trending(limit = 12) {
    return shayariRepository.find(
      { status: STATUS.PUBLISHED, trending: true },
      { sort: { popularityScore: -1, views: -1 }, limit, populate: [{ path: "category", select: "name slug" }] }
    );
  },

  async latest(limit = 12) {
    return shayariRepository.find(
      { status: STATUS.PUBLISHED },
      { sort: { publishedAt: -1 }, limit, populate: [{ path: "category", select: "name slug" }] }
    );
  },

  async random(count = 1) {
    const docs = await shayariRepository.random(Number(count) || 1);
    return docs.length === 1 ? docs[0] : docs;
  },

  async todays() {
    // Deterministic "today's pick" — stable within a day, rotates daily.
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const total = await shayariRepository.count({ status: STATUS.PUBLISHED });
    if (!total) return null;
    const dayIndex = Math.floor(start.getTime() / 86400000) % total;
    const [pick] = await shayariRepository.find(
      { status: STATUS.PUBLISHED },
      { sort: { createdAt: 1 }, skip: dayIndex, limit: 1, populate: [{ path: "category", select: "name slug" }] }
    );
    return pick || null;
  },

  async search(term, query) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await shayariRepository.search(term, { skip, limit });
    return { items, meta: buildMeta(total, page, limit) };
  },

  async suggest(term, limit = 6) {
    if (!term || term.length < 2) return [];
    const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return shayariRepository.find(
      { status: STATUS.PUBLISHED, title: rx },
      { select: "title slug", limit, sort: { views: -1 } }
    );
  },

  /* -------- Engagement (idempotent toggles) -------- */
  async toggleReaction(shayariId, userId, type) {
    const shayari = await Shayari.findById(shayariId);
    if (!shayari) throw ApiError.notFound("Shayari not found");

    const counterField = { [REACTION.LIKE]: "likes", [REACTION.BOOKMARK]: "bookmarks" }[type];
    const existing = await reactionRepository.findOne({ user: userId, shayari: shayariId, type });

    if (existing) {
      await reactionRepository.deleteById(existing._id);
      await shayariRepository.incrementCounter(shayariId, counterField, -1);
      await this._syncUserList(userId, shayariId, type, false);
      return { active: false, [counterField]: Math.max(0, shayari[counterField] - 1) };
    }
    await reactionRepository.create({ user: userId, shayari: shayariId, type });
    await shayariRepository.incrementCounter(shayariId, counterField, 1);
    await this._syncUserList(userId, shayariId, type, true);
    return { active: true, [counterField]: shayari[counterField] + 1 };
  },

  async _syncUserList(userId, shayariId, type, add) {
    const field = type === REACTION.LIKE ? "likedShayari" : "bookmarks";
    const op = add ? { $addToSet: { [field]: shayariId } } : { $pull: { [field]: shayariId } };
    await userRepository.updateById(userId, op);
  },

  async recordShare(shayariId) {
    const shayari = await shayariRepository.incrementCounter(shayariId, "shares", 1);
    if (!shayari) throw ApiError.notFound("Shayari not found");
    return { shares: shayari.shares };
  },

  async bulkAction(ids, action) {
    switch (action) {
      case "delete": {
        for (const id of ids) await this.remove(id); // keeps counters consistent
        return { affected: ids.length };
      }
      case "publish":
        await Shayari.updateMany(
          { _id: { $in: ids }, status: { $ne: STATUS.PUBLISHED } },
          { status: STATUS.PUBLISHED, publishedAt: new Date() }
        );
        break;
      case "draft":
        await Shayari.updateMany({ _id: { $in: ids } }, { status: STATUS.DRAFT });
        break;
      case "archive":
        await Shayari.updateMany({ _id: { $in: ids } }, { status: STATUS.ARCHIVED });
        break;
      case "feature":
        await Shayari.updateMany({ _id: { $in: ids } }, { featured: true });
        break;
      case "unfeature":
        await Shayari.updateMany({ _id: { $in: ids } }, { featured: false });
        break;
      case "trending":
        await Shayari.updateMany({ _id: { $in: ids } }, { trending: true });
        break;
      case "untrending":
        await Shayari.updateMany({ _id: { $in: ids } }, { trending: false });
        break;
      default:
        throw ApiError.badRequest("Unknown bulk action");
    }
    return { affected: ids.length };
  },
};

export default shayariService;
