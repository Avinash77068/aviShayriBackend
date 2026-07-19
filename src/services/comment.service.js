import ApiError from "../utils/ApiError.js";
import { commentRepository } from "../repositories/index.js";
import { Comment, Shayari } from "../models/index.js";
import { shayariRepository } from "../repositories/index.js";
import { cleanText } from "../helpers/sanitize.js";
import { COMMENT_STATUS, ROLES } from "../constants/index.js";
import { parsePagination, buildMeta, parseSort } from "../utils/pagination.js";

const MAX_DEPTH = 4;

// Very small heuristic spam filter — flags link-spam / repeated-char content.
const looksLikeSpam = (text) => {
  const links = (text.match(/https?:\/\//gi) || []).length;
  const repeated = /(.)\1{9,}/.test(text);
  return links >= 3 || repeated;
};

export const commentService = {
  async thread(shayariId, { viewer = null } = {}) {
    const includeAll = viewer && (viewer.role === ROLES.ADMIN || viewer.role === ROLES.EDITOR);
    const flat = await commentRepository.threadFor(shayariId, { includeAll });
    // Rebuild a nested tree from the flat, chronologically-sorted list.
    const byId = new Map();
    const roots = [];
    flat.forEach((c) => {
      c.replies = [];
      byId.set(String(c._id), c);
    });
    flat.forEach((c) => {
      if (c.parent && byId.has(String(c.parent))) byId.get(String(c.parent)).replies.push(c);
      else roots.push(c);
    });
    return roots;
  },

  async create({ shayari, content, parent }, user) {
    const target = await Shayari.findById(shayari).select("_id");
    if (!target) throw ApiError.notFound("Shayari not found");

    let depth = 0;
    let path = [];
    if (parent) {
      const parentDoc = await Comment.findById(parent);
      if (!parentDoc || parentDoc.isDeleted) throw ApiError.badRequest("Parent comment not found");
      if (String(parentDoc.shayari) !== String(shayari)) throw ApiError.badRequest("Parent belongs to another shayari");
      depth = Math.min(parentDoc.depth + 1, MAX_DEPTH);
      path = [...parentDoc.path, parentDoc._id];
    }

    const clean = cleanText(content);
    const status = looksLikeSpam(clean) ? COMMENT_STATUS.PENDING : COMMENT_STATUS.APPROVED;

    const comment = await commentRepository.create({
      shayari,
      user: user._id,
      content: clean,
      parent: parent || null,
      path,
      depth,
      status,
    });

    if (status === COMMENT_STATUS.APPROVED) {
      await shayariRepository.incrementCounter(shayari, "commentCount", 1);
    }
    return Comment.findById(comment._id).populate({ path: "user", select: "name avatar role" }).lean();
  },

  async update(id, content, user) {
    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) throw ApiError.notFound("Comment not found");
    if (String(comment.user) !== String(user._id)) throw ApiError.forbidden("You can only edit your own comment");
    comment.content = cleanText(content);
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();
    return comment;
  },

  async remove(id, user) {
    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) throw ApiError.notFound("Comment not found");
    const isOwner = String(comment.user) === String(user._id);
    const isPrivileged = user.role === ROLES.ADMIN || user.role === ROLES.EDITOR;
    if (!isOwner && !isPrivileged) throw ApiError.forbidden("Not allowed to delete this comment");

    // Soft-delete so the thread structure survives; blank the content.
    comment.isDeleted = true;
    comment.content = "[deleted]";
    await comment.save();
    if (comment.status === COMMENT_STATUS.APPROVED) {
      await shayariRepository.incrementCounter(comment.shayari, "commentCount", -1);
    }
    return { deleted: true };
  },

  async toggleLike(id, userId) {
    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) throw ApiError.notFound("Comment not found");
    const liked = comment.likedBy.some((u) => String(u) === String(userId));
    if (liked) {
      comment.likedBy.pull(userId);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.likedBy.push(userId);
      comment.likes += 1;
    }
    await comment.save();
    return { liked: !liked, likes: comment.likes };
  },

  async report(id, userId, reason) {
    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) throw ApiError.notFound("Comment not found");
    const already = comment.reports.some((r) => String(r.user) === String(userId));
    if (already) return { reported: true, already: true };
    comment.reports.push({ user: userId, reason: cleanText(reason) });
    comment.reportCount = comment.reports.length;
    // Auto-hide when a threshold of reports is reached, pending moderation.
    if (comment.reportCount >= 5 && comment.status === COMMENT_STATUS.APPROVED) {
      comment.status = COMMENT_STATUS.PENDING;
    }
    await comment.save();
    return { reported: true };
  },

  /* -------- Admin moderation -------- */
  async listForModeration(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.reported === "true") filter.reportCount = { $gt: 0 };
    const { items, total } = await commentRepository.paginate(filter, {
      page,
      limit,
      skip,
      sort: parseSort(query.sort, { createdAt: -1 }),
      populate: [
        { path: "user", select: "name email avatar" },
        { path: "shayari", select: "title slug" },
      ],
    });
    return { items, meta: buildMeta(total, page, limit) };
  },

  async moderate(id, status) {
    const comment = await Comment.findById(id);
    if (!comment) throw ApiError.notFound("Comment not found");
    const wasApproved = comment.status === COMMENT_STATUS.APPROVED;
    comment.status = status;
    await comment.save();
    // Keep the shayari's commentCount in sync with approval state.
    const nowApproved = status === COMMENT_STATUS.APPROVED;
    if (wasApproved && !nowApproved) await shayariRepository.incrementCounter(comment.shayari, "commentCount", -1);
    if (!wasApproved && nowApproved) await shayariRepository.incrementCounter(comment.shayari, "commentCount", 1);
    return comment;
  },
};

export default commentService;
