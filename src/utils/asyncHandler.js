/**
 * Wraps an async route handler so any thrown/rejected error is forwarded
 * to the Express error middleware — no try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
