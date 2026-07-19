import BaseRepository from "./base.repository.js";
import { Comment } from "../models/index.js";

const USER_POPULATE = { path: "user", select: "name avatar role" };

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  /** Fetch the whole approved thread for a shayari (flat, client rebuilds tree). */
  threadFor(shayariId, { includeAll = false } = {}) {
    const filter = { shayari: shayariId, isDeleted: false };
    if (!includeAll) filter.status = "approved";
    return this.model.find(filter).sort({ createdAt: 1 }).populate(USER_POPULATE).lean();
  }

  countFor(shayariId) {
    return this.model.countDocuments({
      shayari: shayariId,
      isDeleted: false,
      status: "approved",
    });
  }
}

export const commentRepository = new CommentRepository();
export { USER_POPULATE };
export default commentRepository;
