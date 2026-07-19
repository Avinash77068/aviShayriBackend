import { HTTP } from "../constants/index.js";

/**
 * Operational error carrying an HTTP status code. Thrown anywhere in the
 * request lifecycle and translated to a JSON response by the error middleware.
 */
export default class ApiError extends Error {
  constructor(statusCode, message, { errors = null, isOperational = true } = {}) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = "Bad request", errors = null) {
    return new ApiError(HTTP.BAD_REQUEST, msg, { errors });
  }
  static unauthorized(msg = "Unauthorized") {
    return new ApiError(HTTP.UNAUTHORIZED, msg);
  }
  static forbidden(msg = "Forbidden") {
    return new ApiError(HTTP.FORBIDDEN, msg);
  }
  static notFound(msg = "Not found") {
    return new ApiError(HTTP.NOT_FOUND, msg);
  }
  static conflict(msg = "Conflict") {
    return new ApiError(HTTP.CONFLICT, msg);
  }
  static unprocessable(msg = "Unprocessable entity", errors = null) {
    return new ApiError(HTTP.UNPROCESSABLE, msg, { errors });
  }
  static tooMany(msg = "Too many requests") {
    return new ApiError(HTTP.TOO_MANY, msg);
  }
  static internal(msg = "Internal server error") {
    return new ApiError(HTTP.SERVER_ERROR, msg, { isOperational: false });
  }
}
