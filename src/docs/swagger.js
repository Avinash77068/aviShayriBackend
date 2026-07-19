import swaggerJsdoc from "swagger-jsdoc";
import env from "../config/env.js";

/**
 * Minimal OpenAPI document. Route-level JSDoc can be added incrementally;
 * this gives a browsable base spec + auth scheme at /api/v1/docs.
 */
const definition = {
  openapi: "3.0.3",
  info: {
    title: "Shayari Platform API",
    version: "1.0.0",
    description: "REST API for the Shayari platform — auth, content, comments, analytics.",
  },
  servers: [{ url: env.apiPrefix, description: env.nodeEnv }],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: env.cookie.accessName },
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  tags: [
    { name: "Auth" },
    { name: "Shayari" },
    { name: "Categories" },
    { name: "Comments" },
    { name: "Users" },
    { name: "Analytics" },
  ],
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  apis: ["./src/routes/*.js"],
});

export default swaggerSpec;
