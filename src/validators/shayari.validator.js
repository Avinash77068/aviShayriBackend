import { z } from "zod";
import { objectId, objectIdOptional } from "./common.validator.js";
import { STATUS } from "../constants/index.js";

const seoFields = {
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(320).optional(),
  seoKeywords: z.array(z.string()).optional(),
};

export const createShayariSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(200),
    content: z.string().trim().min(2),
    excerpt: z.string().max(320).optional(),
    category: objectId,
    language: objectIdOptional,
    author: objectIdOptional,
    tags: z.array(objectId).optional(),
    featuredImage: z.string().optional(),
    featured: z.boolean().optional(),
    trending: z.boolean().optional(),
    status: z.enum(Object.values(STATUS)).optional(),
    ...seoFields,
  }),
});

export const updateShayariSchema = z.object({
  body: createShayariSchema.shape.body.partial(),
});

export const listShayariQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sort: z.string().optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
    author: z.string().optional(),
    language: z.string().optional(),
    status: z.enum(Object.values(STATUS)).optional(),
    featured: z.enum(["true", "false"]).optional(),
    trending: z.enum(["true", "false"]).optional(),
    search: z.string().optional(),
  }),
});

export const searchQuery = z.object({
  query: z.object({
    q: z.string().trim().min(1, "Search query is required"),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const bulkActionSchema = z.object({
  body: z.object({
    ids: z.array(objectId).min(1, "Select at least one item"),
    action: z.enum(["delete", "publish", "draft", "archive", "feature", "unfeature", "trending", "untrending"]),
  }),
});
