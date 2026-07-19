import { z } from "zod";
import { objectId } from "./common.validator.js";

/* -------- Category -------- */
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().max(1000).optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    color: z.string().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
  }),
});
export const updateCategorySchema = z.object({ body: createCategorySchema.shape.body.partial() });

/* -------- Tag -------- */
export const createTagSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(60),
    description: z.string().optional(),
  }),
});
export const updateTagSchema = z.object({ body: createTagSchema.shape.body.partial() });

/* -------- Author -------- */
export const createAuthorSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    bio: z.string().max(2000).optional(),
    avatar: z.string().optional(),
    socialLinks: z
      .object({
        website: z.string().optional(),
        twitter: z.string().optional(),
        instagram: z.string().optional(),
        facebook: z.string().optional(),
        youtube: z.string().optional(),
      })
      .optional(),
  }),
});
export const updateAuthorSchema = z.object({ body: createAuthorSchema.shape.body.partial() });

/* -------- Language -------- */
export const createLanguageSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    code: z.string().trim().min(2).max(8),
    nativeName: z.string().optional(),
    direction: z.enum(["ltr", "rtl"]).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
  }),
});
export const updateLanguageSchema = z.object({ body: createLanguageSchema.shape.body.partial() });

/* -------- Comment -------- */
export const createCommentSchema = z.object({
  body: z.object({
    shayari: objectId,
    content: z.string().trim().min(1).max(2000),
    parent: objectId.optional().nullable(),
  }),
});
export const updateCommentSchema = z.object({
  body: z.object({ content: z.string().trim().min(1).max(2000) }),
});
export const reportCommentSchema = z.object({
  body: z.object({ reason: z.string().trim().min(3).max(300) }),
});
export const moderateCommentSchema = z.object({
  body: z.object({ status: z.enum(["pending", "approved", "spam", "rejected"]) }),
});

/* -------- User (admin) -------- */
export const adminUpdateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    role: z.enum(["admin", "editor", "user"]).optional(),
    status: z.enum(["active", "suspended", "banned"]).optional(),
  }),
});
