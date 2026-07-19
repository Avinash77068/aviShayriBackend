import ApiError from "../utils/ApiError.js";
import {
  categoryRepository,
  tagRepository,
  authorRepository,
  languageRepository,
} from "../repositories/index.js";
import { Category, Tag, Author, Language, Shayari } from "../models/index.js";
import { uniqueSlug } from "../utils/slug.js";
import { parsePagination, buildMeta, parseSort } from "../utils/pagination.js";
import { cleanText, cleanRichText } from "../helpers/sanitize.js";

/** Factory that produces a standard slugged-CRUD service for a model. */
const makeSluggedService = ({ repo, model, label, sanitizeName = cleanText }) => ({
  async list(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.search) filter.name = new RegExp(String(query.search), "i");
    if (query.isActive !== undefined) filter.isActive = query.isActive === "true";
    const { items, total } = await repo.paginate(filter, {
      page,
      limit,
      skip,
      sort: parseSort(query.sort, { order: 1, name: 1 }),
    });
    return { items, meta: buildMeta(total, page, limit) };
  },

  async all() {
    return repo.find({}, { sort: { order: 1, name: 1 }, limit: 0 });
  },

  async getById(id) {
    const doc = await repo.findById(id);
    if (!doc) throw ApiError.notFound(`${label} not found`);
    return doc;
  },

  async getBySlug(slug) {
    const doc = await repo.findBySlug(slug);
    if (!doc) throw ApiError.notFound(`${label} not found`);
    return doc;
  },

  async create(body) {
    const slug = await uniqueSlug(body.name, (s) => repo.slugExists(s));
    return repo.create({ ...body, name: sanitizeName(body.name), slug });
  },

  async update(id, body) {
    const existing = await model.findById(id);
    if (!existing) throw ApiError.notFound(`${label} not found`);
    const update = { ...body };
    if (body.name) {
      update.name = sanitizeName(body.name);
      if (body.name !== existing.name) {
        update.slug = await uniqueSlug(body.name, (s) => repo.slugExists(s), { ignoreId: id });
      }
    }
    return repo.updateById(id, update, { new: true, runValidators: true });
  },

  async remove(id) {
    const doc = await model.findById(id);
    if (!doc) throw ApiError.notFound(`${label} not found`);
    await repo.deleteById(id);
    return { deleted: true };
  },
});

/* -------- Category -------- */
export const categoryService = {
  ...makeSluggedService({ repo: categoryRepository, model: Category, label: "Category" }),
  async remove(id) {
    const inUse = await Shayari.exists({ category: id });
    if (inUse) throw ApiError.conflict("Cannot delete a category that still has shayari");
    return makeSluggedService({ repo: categoryRepository, model: Category, label: "Category" }).remove(id);
  },
  async withCounts() {
    return categoryRepository.find({ isActive: true }, { sort: { order: 1, name: 1 }, limit: 0 });
  },
};

/* -------- Tag -------- */
export const tagService = {
  ...makeSluggedService({ repo: tagRepository, model: Tag, label: "Tag" }),
  async popular(limit = 20) {
    return tagRepository.find({}, { sort: { usageCount: -1 }, limit });
  },
};

/* -------- Author -------- */
export const authorService = makeSluggedService({
  repo: authorRepository,
  model: Author,
  label: "Author",
  sanitizeName: (n) => cleanText(n),
});
// Bios are rich text — sanitize on write.
const _authorCreate = authorService.create;
authorService.create = async (body) =>
  _authorCreate({ ...body, bio: body.bio ? cleanRichText(body.bio) : "" });

/* -------- Language -------- */
export const languageService = {
  ...makeSluggedService({ repo: languageRepository, model: Language, label: "Language" }),
  async create(body) {
    const exists = await Language.exists({ code: String(body.code).toLowerCase() });
    if (exists) throw ApiError.conflict("Language code already exists");
    const slug = await uniqueSlug(body.name, (s) => languageRepository.slugExists(s));
    return languageRepository.create({ ...body, code: String(body.code).toLowerCase(), slug });
  },
};
