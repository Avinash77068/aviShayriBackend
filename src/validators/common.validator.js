import { z } from "zod";
import mongoose from "mongoose";

export const objectId = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), { message: "Invalid id" });

export const objectIdOptional = objectId.optional();

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.string().optional(),
  search: z.string().trim().optional(),
});

export const email = z.string().trim().toLowerCase().email("Invalid email");

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const slugParam = z.object({ slug: z.string().trim().min(1) });
export const idParam = z.object({ id: objectId });
