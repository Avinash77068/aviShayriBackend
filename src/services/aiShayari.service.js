import env from "../config/env.js";
import logger from "../config/logger.js";
import { Shayari, Author, Category, Language } from "../models/index.js";
import { STATUS } from "../constants/index.js";
import { toSlug, uniqueSlug } from "../utils/slug.js";
import { calcReadingTime } from "../utils/readingTime.js";
import { cleanText } from "../helpers/sanitize.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const buildPrompt = (count, categories, avoid, avoidAuthors) =>
  `Write ${count} completely ORIGINAL shayari (2-6 lines each) in Hindi (Devanagari script).
Rules:
- Every shayari must be newly composed by you. Do NOT quote, paraphrase or closely imitate any existing shayari, poem, song lyric or famous couplet from the internet.
- Use fresh imagery and unusual phrasing; avoid clichés that are widely reused online.
- Each one must have a different theme. Pick categories from: ${categories.join(", ")}.
- Give each shayari its own fictional South Asian poet pen name in Latin script. Do not use a real, famous or historical person's name, and do not reuse any names from this list: ${avoidAuthors.length ? avoidAuthors.join(" | ") : "none"}.
- Do not reuse these titles/opening lines: ${avoid.length ? avoid.join(" | ") : "none"}.
Return ONLY valid JSON, no markdown, in this shape:
{"shayari":[{"title":"short title","content":"lines separated by \\n","authorName":"fictional poet name","category":"one of the categories above","tags":["tag1","tag2"]}]}`;

const callOpenRouter = async (prompt) => {
  const { apiKey, model, siteUrl, siteName } = env.openRouter;
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl,
      "X-Title": siteName,
    },
    body: JSON.stringify({
      model,
      temperature: 1.1,
      messages: [
        { role: "system", content: "You are an original Urdu/Hindi shayari poet. You never copy existing work." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(json);
  return Array.isArray(parsed.shayari) ? parsed.shayari : [];
};

const createGeneratedAuthor = async (name) => {
  const slug = await uniqueSlug(name, (candidate) => Author.exists({ slug: candidate }));
  return Author.create({
    name,
    slug,
    bio: "A fictional poet name created for original shayari.",
  });
};

export const aiShayariService = {
  /** Generate original shayari with fictional author bylines via OpenRouter. */
  async generateDaily(count = env.openRouter.dailyCount) {
    if (!env.openRouter.enabled) {
      logger.warn("[ai-shayari] OPENROUTER_API_KEY missing; skipping");
      return { created: 0 };
    }

    const [categories, language, recent, recentAuthors] = await Promise.all([
      Category.find().select("name").lean(),
      Language.findOne({ code: env.openRouter.languageCode }).lean(),
      Shayari.find().sort({ createdAt: -1 }).limit(100).select("title content").lean(),
      Author.find().sort({ createdAt: -1 }).limit(100).select("name").lean(),
    ]);
    if (!categories.length) throw new Error("No categories exist; run the seed first");

    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
    const avoid = recent.slice(0, 30).map((s) => s.title);
    const avoidAuthors = recentAuthors.map((author) => author.name);
    const seenAuthors = new Set(avoidAuthors.map(normalize));

    // Over-request a little so duplicates can be dropped and we still hit `count`.
    const items = await callOpenRouter(buildPrompt(count + 3, categories.map((c) => c.name), avoid, avoidAuthors));

    // Dedupe against stored content (exact normalized match on full text or first line).
    const seen = new Set();
    recent.forEach((s) => {
      seen.add(normalize(s.content));
      seen.add(normalize(String(s.content).split("\n")[0]));
    });

    let created = 0;
    for (const item of items) {
      if (created >= count) break;
      // Models sometimes double-escape newlines, leaving a literal "\\n" in the text.
      const content = String(item.content || "").replace(/\\n/g, "\n").trim();
      const title = cleanText(item.title || "").slice(0, 200);
      const rawAuthorName = typeof item.authorName === "string" ? item.authorName : "";
      const authorName = cleanText(rawAuthorName).replace(/\s+/g, " ").slice(0, 120);
      const normalizedAuthor = normalize(authorName);
      if (!content || !title || !authorName || seenAuthors.has(normalizedAuthor)) continue;
      const full = normalize(content);
      const first = normalize(content.split("\n")[0]);
      if (seen.has(full) || seen.has(first)) continue;
      const exists = await Shayari.exists({ $text: { $search: `"${content.split("\n")[0].replace(/"/g, "")}"` } }).catch(() => null);
      if (exists) continue;

      const category = catByName.get(String(item.category || "").toLowerCase()) || categories[created % categories.length];
      const slug = await uniqueSlug(title, (s) => Shayari.exists({ slug: s }));
      const authorSlug = toSlug(authorName);
      if (await Author.exists({ slug: authorSlug })) continue;
      const author = await createGeneratedAuthor(authorName);
      // Plain newlines: the frontend renders shayari with `white-space: pre-line`.
      const body = content.split("\n").map((l) => cleanText(l)).filter(Boolean).join("\n");

      await Shayari.create({
        title,
        slug,
        content: body,
        excerpt: cleanText(content).slice(0, 200),
        category: category._id,
        author: author._id,
        language: language?._id,
        status: env.openRouter.status,
        publishedAt: env.openRouter.status === STATUS.PUBLISHED ? new Date() : null,
        readingTime: calcReadingTime(content),
      });
      await Promise.all([
        Category.findByIdAndUpdate(category._id, { $inc: { shayariCount: 1 } }),
        Author.findByIdAndUpdate(author._id, { $inc: { shayariCount: 1 } }),
      ]);
      seen.add(full);
      seen.add(first);
      seenAuthors.add(normalizedAuthor);
      created += 1;
    }

    logger.info(`[ai-shayari] created ${created}/${count} shayari (${env.openRouter.status})`);
    return { created };
  },
};

export default aiShayariService;
