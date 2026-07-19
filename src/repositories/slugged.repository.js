import BaseRepository from "./base.repository.js";
import { Category, Tag, Author, Language } from "../models/index.js";

/** Shared repository for models keyed by a unique slug. */
class SluggedRepository extends BaseRepository {
  slugExists(slug, ignoreId = null) {
    const filter = { slug };
    if (ignoreId) filter._id = { $ne: ignoreId };
    return this.model.exists(filter);
  }

  findBySlug(slug, opts = {}) {
    return this.findOne({ slug }, opts);
  }
}

export const categoryRepository = new SluggedRepository(Category);
export const tagRepository = new SluggedRepository(Tag);
export const authorRepository = new SluggedRepository(Author);
export const languageRepository = new SluggedRepository(Language);
