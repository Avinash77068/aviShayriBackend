import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { categoryService, tagService, authorService, languageService } from "../services/content.service.js";
import { recordAudit } from "../middlewares/audit.middleware.js";
import { AUDIT_ACTIONS } from "../constants/index.js";

/** Build a standard CRUD controller from a slugged-CRUD service. */
const makeCrudController = (service, entity) => ({
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await service.list(req.query);
    return ApiResponse.ok(res, items, `${entity} list`, meta);
  }),
  all: asyncHandler(async (_req, res) => {
    const items = await service.all();
    return ApiResponse.ok(res, items, `All ${entity}`);
  }),
  getBySlug: asyncHandler(async (req, res) => {
    const doc = await service.getBySlug(req.params.slug);
    return ApiResponse.ok(res, doc, `${entity} fetched`);
  }),
  getById: asyncHandler(async (req, res) => {
    const doc = await service.getById(req.params.id);
    return ApiResponse.ok(res, doc, `${entity} fetched`);
  }),
  create: asyncHandler(async (req, res) => {
    const doc = await service.create(req.body);
    recordAudit(req, { action: AUDIT_ACTIONS.CREATE, entity, entityId: doc._id, description: `Created ${entity} "${doc.name}"` });
    return ApiResponse.created(res, doc, `${entity} created`);
  }),
  update: asyncHandler(async (req, res) => {
    const doc = await service.update(req.params.id, req.body);
    recordAudit(req, { action: AUDIT_ACTIONS.UPDATE, entity, entityId: req.params.id, description: `Updated ${entity}` });
    return ApiResponse.ok(res, doc, `${entity} updated`);
  }),
  remove: asyncHandler(async (req, res) => {
    await service.remove(req.params.id);
    recordAudit(req, { action: AUDIT_ACTIONS.DELETE, entity, entityId: req.params.id, description: `Deleted ${entity}` });
    return ApiResponse.ok(res, null, `${entity} deleted`);
  }),
});

export const categoryController = {
  ...makeCrudController(categoryService, "Category"),
  withCounts: asyncHandler(async (_req, res) => {
    const data = await categoryService.withCounts();
    return ApiResponse.ok(res, data, "Categories with counts");
  }),
};

export const tagController = {
  ...makeCrudController(tagService, "Tag"),
  popular: asyncHandler(async (req, res) => {
    const data = await tagService.popular(Number(req.query.limit) || 20);
    return ApiResponse.ok(res, data, "Popular tags");
  }),
};

export const authorController = makeCrudController(authorService, "Author");
export const languageController = makeCrudController(languageService, "Language");
