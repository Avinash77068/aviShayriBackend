import { z } from "zod";
import { email, password } from "./common.validator.js";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    email,
    password,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10, "Reset token is required"),
    password,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: password,
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    // Accept a full URL (Cloudinary) OR a relative upload path (local-disk
    // fallback, e.g. "/uploads/x.png") OR an empty string to clear it.
    avatar: z
      .string()
      .max(2000)
      .refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), {
        message: "Avatar must be a URL or upload path",
      })
      .optional(),
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({ token: z.string().min(10) }),
});
