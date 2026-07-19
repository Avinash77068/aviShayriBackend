import {
  Shayari,
  Category,
  User,
  Comment,
  Tag,
  Author,
} from "../models/index.js";
import { AuditLog } from "../models/index.js";
import { STATUS } from "../constants/index.js";

/** Sum a numeric field across all shayari via aggregation. */
const sumField = async (field) => {
  const [row] = await Shayari.aggregate([{ $group: { _id: null, total: { $sum: `$${field}` } } }]);
  return row?.total || 0;
};

export const analyticsService = {
  async dashboard() {
    const [
      totalShayari,
      publishedShayari,
      draftShayari,
      totalCategories,
      totalTags,
      totalAuthors,
      totalUsers,
      totalComments,
      pendingComments,
      views,
      likes,
      shares,
      bookmarks,
    ] = await Promise.all([
      Shayari.countDocuments(),
      Shayari.countDocuments({ status: STATUS.PUBLISHED }),
      Shayari.countDocuments({ status: STATUS.DRAFT }),
      Category.countDocuments(),
      Tag.countDocuments(),
      Author.countDocuments(),
      User.countDocuments(),
      Comment.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ status: "pending" }),
      sumField("views"),
      sumField("likes"),
      sumField("shares"),
      sumField("bookmarks"),
    ]);

    const [mostPopular, recentShayari, recentActivity, topCategories] = await Promise.all([
      Shayari.find({ status: STATUS.PUBLISHED })
        .sort({ views: -1, likes: -1 })
        .limit(5)
        .select("title slug views likes shares")
        .lean(),
      Shayari.find().sort({ createdAt: -1 }).limit(5).select("title slug status createdAt").lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate({ path: "actor", select: "name role" }).lean(),
      Category.find().sort({ shayariCount: -1 }).limit(5).select("name slug shayariCount").lean(),
    ]);

    return {
      totals: {
        shayari: totalShayari,
        published: publishedShayari,
        drafts: draftShayari,
        categories: totalCategories,
        tags: totalTags,
        authors: totalAuthors,
        users: totalUsers,
        comments: totalComments,
        pendingComments,
        views,
        likes,
        shares,
        bookmarks,
      },
      mostPopular,
      recentShayari,
      recentActivity,
      topCategories,
    };
  },

  /** Views/engagement over the last N days for charts. */
  async timeseries(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const rows = await Shayari.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          created: { $sum: 1 },
          views: { $sum: "$views" },
          likes: { $sum: "$likes" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => ({ date: r._id, ...r, _id: undefined }));
  },

  async popular({ metric = "views", limit = 10 } = {}) {
    const allowed = ["views", "likes", "shares", "bookmarks", "popularityScore", "commentCount"];
    const sortField = allowed.includes(metric) ? metric : "views";
    return Shayari.find({ status: STATUS.PUBLISHED })
      .sort({ [sortField]: -1 })
      .limit(Number(limit) || 10)
      .select(`title slug ${allowed.join(" ")}`)
      .populate({ path: "category", select: "name slug" })
      .lean();
  },
};

export default analyticsService;
