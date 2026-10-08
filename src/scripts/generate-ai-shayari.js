import mongoose from "mongoose";
import "../config/env.js";
import { connectDB } from "../config/db.js";
import { aiShayariService } from "../services/aiShayari.service.js";

await connectDB();
const result = await aiShayariService.generateDaily();
console.log(result);
await mongoose.disconnect();
