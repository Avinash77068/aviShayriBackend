import ApiError from "../utils/ApiError.js";
import { userRepository } from "../repositories/index.js";
import { User } from "../models/index.js";
import { parsePagination, buildMeta, parseSort } from "../utils/pagination.js";
import { cleanText } from "../helpers/sanitize.js";

export const userService = {
  async list(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.search) {
      const rx = new RegExp(String(query.search), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const { items, total } = await userRepository.paginate(filter, {
      page,
      limit,
      skip,
      sort: parseSort(query.sort, { createdAt: -1 }),
      select: "-password",
    });
    return { items, meta: buildMeta(total, page, limit) };
  },

  async getById(id) {
    const user = await userRepository.findById(id, { select: "-password" });
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  async adminUpdate(id, body, actor) {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound("User not found");
    // Guard: prevent an admin from demoting/locking themselves out accidentally.
    if (String(actor._id) === String(id) && body.role && body.role !== "admin") {
      throw ApiError.badRequest("You cannot change your own admin role");
    }
    if (body.name) user.name = cleanText(body.name);
    if (body.role) user.role = body.role;
    if (body.status) user.status = body.status;
    await user.save();
    return user.toSafeJSON();
  },

  async remove(id, actor) {
    if (String(actor._id) === String(id)) throw ApiError.badRequest("You cannot delete your own account here");
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound("User not found");
    await userRepository.deleteById(id);
    return { deleted: true };
  },

  /* -------- Self-service collections / library -------- */
  async bookmarks(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const user = await User.findById(userId).populate({
      path: "bookmarks",
      options: { skip, limit, sort: { createdAt: -1 } },
      populate: { path: "category", select: "name slug" },
    });
    if (!user) throw ApiError.notFound("User not found");
    return { items: user.bookmarks, meta: buildMeta(user.bookmarks.length, page, limit) };
  },

  async recentlyViewed(userId) {
    const user = await User.findById(userId).populate({
      path: "recentlyViewed.shayari",
      select: "title slug excerpt featuredImage",
    });
    if (!user) throw ApiError.notFound("User not found");
    return user.recentlyViewed.filter((r) => r.shayari);
  },

  async createCollection(userId, name) {
    const user = await User.findById(userId);
    const slug = cleanText(name).toLowerCase().replace(/\s+/g, "-");
    user.collections.push({ name: cleanText(name), slug, items: [] });
    await user.save();
    return user.collections;
  },

  async addToCollection(userId, collectionId, shayariId) {
    const user = await User.findById(userId);
    const col = user.collections.id(collectionId);
    if (!col) throw ApiError.notFound("Collection not found");
    if (!col.items.some((i) => String(i) === String(shayariId))) col.items.push(shayariId);
    await user.save();
    return col;
  },
};

export default userService;
