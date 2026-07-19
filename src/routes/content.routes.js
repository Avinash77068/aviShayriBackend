import { Router } from "express";
import {
  categoryController,
  tagController,
  authorController,
  languageController,
} from "../controllers/content.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
  createTagSchema,
  updateTagSchema,
  createAuthorSchema,
  updateAuthorSchema,
  createLanguageSchema,
  updateLanguageSchema,
} from "../validators/content.validator.js";
import { ROLES } from "../constants/index.js";

const editorOrAdmin = [authenticate, authorize(ROLES.EDITOR, ROLES.ADMIN)];
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

/* -------- Categories -------- */
const categories = Router();
categories.get("/", categoryController.list);
categories.get("/all", categoryController.withCounts);
categories.get("/:slug", categoryController.getBySlug);
categories.post("/", ...editorOrAdmin, validate(createCategorySchema), categoryController.create);
categories.put("/:id", ...editorOrAdmin, validate(updateCategorySchema), categoryController.update);
categories.delete("/:id", ...adminOnly, categoryController.remove);

/* -------- Tags -------- */
const tags = Router();
tags.get("/", tagController.list);
tags.get("/popular", tagController.popular);
tags.get("/:slug", tagController.getBySlug);
tags.post("/", ...editorOrAdmin, validate(createTagSchema), tagController.create);
tags.put("/:id", ...editorOrAdmin, validate(updateTagSchema), tagController.update);
tags.delete("/:id", ...adminOnly, tagController.remove);

/* -------- Authors -------- */
const authors = Router();
authors.get("/", authorController.list);
authors.get("/:slug", authorController.getBySlug);
authors.post("/", ...editorOrAdmin, validate(createAuthorSchema), authorController.create);
authors.put("/:id", ...editorOrAdmin, validate(updateAuthorSchema), authorController.update);
authors.delete("/:id", ...adminOnly, authorController.remove);

/* -------- Languages -------- */
const languages = Router();
languages.get("/", languageController.all);
languages.post("/", ...adminOnly, validate(createLanguageSchema), languageController.create);
languages.put("/:id", ...adminOnly, validate(updateLanguageSchema), languageController.update);
languages.delete("/:id", ...adminOnly, languageController.remove);

export { categories, tags, authors, languages };
