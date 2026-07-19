import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";
import logger from "../config/logger.js";
import { HTTP } from "../constants/index.js";

/** 404 handler for unmatched routes. */
export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/** Normalize any thrown error into a consistent JSON error response. */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Mongoose bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }
  // Mongoose validation
  else if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.unprocessable("Validation failed", errors);
  }
  // Duplicate key
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = ApiError.conflict(`${field} already exists`);
  }
  // JWT
  else if (err.name === "JsonWebTokenError") {
    error = ApiError.unauthorized("Invalid token");
  } else if (err.name === "TokenExpiredError") {
    error = ApiError.unauthorized("Token expired");
  }
  // Anything that isn't already an ApiError
  else if (!(err instanceof ApiError)) {
    error = new ApiError(err.statusCode || HTTP.SERVER_ERROR, err.message || "Internal server error", {
      isOperational: false,
    });
  }

  const statusCode = error.statusCode || HTTP.SERVER_ERROR;
  if (statusCode >= 500 || !error.isOperational) {
    logger.error(`${req.method} ${req.originalUrl} → ${statusCode} ${error.message}\n${err.stack}`);
  }

  const body = { success: false, message: error.message };
  if (error.errors) body.errors = error.errors;
  if (!env.isProd && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};
