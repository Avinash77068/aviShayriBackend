import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

// On Vercel each request may hit a cold or warm serverless instance. We must
// ensure MongoDB is connected BEFORE Express handles the request, otherwise
// Mongoose buffers the query and eventually throws "buffering timed out".
//
// The connection promise is memoized at module scope so warm invocations
// reuse the existing connection instead of dialing MongoDB every time. On a
// failed cold-start connect we reset the cache so the next request retries.
let connectionPromise;

const ensureDB = () => {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((err) => {
      connectionPromise = undefined;
      throw err;
    });
  }
  return connectionPromise;
};

export default async function handler(req, res) {
  try {
    await ensureDB();
  } catch (err) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ success: false, message: `Database unavailable: ${err.message}` })
    );
    return;
  }
  return app(req, res);
}
