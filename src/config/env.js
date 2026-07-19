import dotenv from "dotenv";

// In non-production, let this project's .env win over pre-existing shell
// variables. This matters here because the developer's shell profile exports a
// company MONGODB_URI; without override, `npm run dev` would silently connect
// to that shared cluster. In production there is no committed .env, so
// platform-provided env vars (Render/Railway/etc.) remain authoritative.
const overrideEnv = (process.env.NODE_ENV || "development") !== "production";
dotenv.config({ override: overrideEnv });

/**
 * Centralized, validated environment configuration.
 * Import `env` everywhere instead of reading `process.env` directly.
 */
const required = (key, fallback = undefined) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    // Do not hard-crash for optional integrations in dev; warn instead.
    console.warn(`[env] Missing environment variable: ${key}`);
  }
  return value;
};

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
};

const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: (process.env.NODE_ENV || "development") === "production",
  port: toNumber(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || "/api/v1",

  // Database — DO NOT default to any shared/company cluster.
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shayari",

  // Client / CORS
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  adminUrl: process.env.ADMIN_URL || "http://localhost:3001",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  // JWT
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    resetSecret: required("JWT_RESET_SECRET", "dev_reset_secret_change_me"),
    resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || "30m",
    verifySecret: required("JWT_VERIFY_SECRET", "dev_verify_secret_change_me"),
    verifyExpiresIn: process.env.JWT_VERIFY_EXPIRES_IN || "1d",
  },

  // Cookies
  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: toBool(process.env.COOKIE_SECURE, isVercel || process.env.NODE_ENV === "production"),
    sameSite: isVercel || process.env.NODE_ENV === "production" ? "none" : (process.env.COOKIE_SAMESITE || "lax"),
    accessName: process.env.ACCESS_COOKIE_NAME || "access_token",
    refreshName: process.env.REFRESH_COOKIE_NAME || "refresh_token",
  },

  // Bcrypt
  bcryptSaltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 12),

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || "shayari",
    enabled: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    ),
  },

  // Mail (Nodemailer)
  mail: {
    host: process.env.SMTP_HOST,
    port: toNumber(process.env.SMTP_PORT, 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || "Shayari <no-reply@shayari.app>",
    enabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
  },

  // Rate limiting
  rateLimit: {
    windowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toNumber(process.env.RATE_LIMIT_MAX, 300),
    authMax: toNumber(process.env.AUTH_RATE_LIMIT_MAX, 20),
  },

  // Seed admin
  seed: {
    adminName: process.env.SEED_ADMIN_NAME || "Super Admin",
    adminEmail: process.env.SEED_ADMIN_EMAIL || "admin@shayari.app",
    adminPassword: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
  },
};

export default env;
