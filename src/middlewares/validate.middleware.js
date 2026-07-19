import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";
import { MESSAGES } from "../constants/index.js";

/**
 * Validate req.{body,query,params} against a Zod schema. On success the parsed
 * (coerced/defaulted) values replace the originals so downstream code trusts them.
 */
export const validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.validatedQuery = parsed.query;
    if (parsed.params !== undefined) req.params = parsed.params;
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({
        field: e.path.filter((p) => p !== "body" && p !== "query" && p !== "params").join("."),
        message: e.message,
      }));
      return next(ApiError.unprocessable(MESSAGES.VALIDATION_FAILED, errors));
    }
    return next(err);
  }
};

export default validate;
