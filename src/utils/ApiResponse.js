/**
 * Standard success response envelope. Keeps every endpoint's payload shape
 * consistent: { success, message, data, meta }.
 */
export default class ApiResponse {
  constructor(res) {
    this.res = res;
  }

  static send(res, statusCode, { message = "OK", data = null, meta = null } = {}) {
    const body = { success: statusCode < 400, message };
    if (data !== null) body.data = data;
    if (meta !== null) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static ok(res, data = null, message = "OK", meta = null) {
    return ApiResponse.send(res, 200, { message, data, meta });
  }

  static created(res, data = null, message = "Created") {
    return ApiResponse.send(res, 201, { message, data });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}
