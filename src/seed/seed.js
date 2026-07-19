/* eslint-disable no-console */
import env from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import logger from "../config/logger.js";
import {
  User,
  Author,
  Category,
  Tag,
  Language,
  Shayari,
  SeoSettings,
  HomepageSection,
} from "../models/index.js";
import { toSlug } from "../utils/slug.js";
import { calcReadingTime } from "../utils/readingTime.js";
import { ROLES, STATUS } from "../constants/index.js";

const CATEGORIES = [
  { name: "Love", icon: "💗", color: "#ec4899", description: "Shayari about love and longing" },
  { name: "Sad", icon: "🥀", color: "#64748b", description: "Melancholy and heartbreak" },
  { name: "Motivational", icon: "🔥", color: "#f59e0b", description: "Words that lift you up" },
  { name: "Friendship", icon: "🤝", color: "#10b981", description: "Dosti and bonds" },
  { name: "Life", icon: "🌱", color: "#8b5cf6", description: "Reflections on life" },
];

const TAGS = ["ishq", "dard", "zindagi", "dosti", "mohabbat", "umeed", "tanhai", "khushi"];

const LANGUAGES = [
  { name: "Hindi", code: "hi", nativeName: "हिन्दी", order: 1 },
  { name: "Urdu", code: "ur", nativeName: "اردو", direction: "rtl", order: 2 },
  { name: "English", code: "en", nativeName: "English", order: 3 },
];

const AUTHORS = [
  { name: "Mirza Ghalib", bio: "The legendary Urdu and Persian poet of the Mughal era." },
  { name: "Gulzar", bio: "Poet, lyricist and film director revered for his subtle imagery." },
  { name: "Anonymous", bio: "Timeless verses whose authors are lost to time." },
];

const SHAYARI = [
  {
    title: "Dil hi to hai",
    content: "Dil hi to hai na sang-o-khisht, dard se bhar na aaye kyun; Royenge hum hazaar baar, koi humein sataaye kyun.",
    cat: "Sad",
    author: "Mirza Ghalib",
    tags: ["dard", "zindagi"],
    lang: "ur",
  },
  {
    title: "Aankhon ki baat",
    content: "Teri aankhon ke sivaa duniya mein rakkha kya hai; Yeh utha len to sitare, yeh jhuka len to jahaan.",
    cat: "Love",
    author: "Gulzar",
    tags: ["ishq", "mohabbat"],
    lang: "hi",
  },
  {
    title: "Rise again",
    content: "The night was long, the road unkind — yet here I stand, with dawn in mind. Fall if you must, but rise once more; the sky belongs to those who soar.",
    cat: "Motivational",
    author: "Anonymous",
    tags: ["umeed", "zindagi"],
    lang: "en",
  },
  {
    title: "Dosti ka rishta",
    content: "Dosti ek aisa rishta hai jise koi naam nahi diya jaata; par isse nibhaane ke liye poori zindagi kam pad jaati hai.",
    cat: "Friendship",
    author: "Anonymous",
    tags: ["dosti", "khushi"],
    lang: "hi",
  },
  {
    title: "Zindagi ka safar",
    content: "Zindagi ka safar hai yeh kaisa safar, koi samjha nahi koi jaana nahi; hai yeh kaisi dagar chalte hain sab magar, koi samjha nahi koi jaana nahi.",
    cat: "Life",
    author: "Anonymous",
    tags: ["zindagi", "tanhai"],
    lang: "hi",
  },
  {
    title: "Tanha raatein",
    content: "Har raat tanha guzarti hai ab, teri yaadon ke siva koi saath nahi; jaagti aankhon mein sapne to hain, par unmein tere siva koi baat nahi.",
    cat: "Sad",
    author: "Gulzar",
    tags: ["tanhai", "dard"],
    lang: "hi",
  },
];

const run = async () => {
  const destroy = process.argv.includes("--destroy");
  await connectDB();

  if (destroy) {
    await Promise.all([
      Shayari.deleteMany({}),
      Category.deleteMany({}),
      Tag.deleteMany({}),
      Author.deleteMany({}),
      Language.deleteMany({}),
      HomepageSection.deleteMany({}),
    ]);
    logger.warn("Seed data destroyed (users preserved)");
    await disconnectDB();
    process.exit(0);
  }

  // Admin user
  let admin = await User.findOne({ email: env.seed.adminEmail });
  if (!admin) {
    admin = await User.create({
      name: env.seed.adminName,
      email: env.seed.adminEmail,
      password: env.seed.adminPassword,
      role: ROLES.ADMIN,
      isEmailVerified: true,
    });
    logger.info(`Created admin: ${admin.email} / ${env.seed.adminPassword}`);
  }

  // Editor + demo user
  await User.findOneAndUpdate(
    { email: "editor@shayari.app" },
    { $setOnInsert: { name: "Editor", email: "editor@shayari.app", password: "Editor@12345", role: ROLES.EDITOR, isEmailVerified: true } },
    { upsert: true, new: true }
  );

  // Languages, categories, tags, authors (idempotent upserts)
  const langMap = {};
  for (const l of LANGUAGES) {
    const doc = await Language.findOneAndUpdate(
      { code: l.code },
      { ...l, slug: toSlug(l.name) },
      { upsert: true, new: true }
    );
    langMap[l.code] = doc;
  }

  const catMap = {};
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { name: c.name },
      { ...c, slug: toSlug(c.name) },
      { upsert: true, new: true }
    );
    catMap[c.name] = doc;
  }

  const tagMap = {};
  for (const t of TAGS) {
    const doc = await Tag.findOneAndUpdate({ name: t }, { name: t, slug: toSlug(t) }, { upsert: true, new: true });
    tagMap[t] = doc;
  }

  const authorMap = {};
  for (const a of AUTHORS) {
    const doc = await Author.findOneAndUpdate(
      { name: a.name },
      { ...a, slug: toSlug(a.name) },
      { upsert: true, new: true }
    );
    authorMap[a.name] = doc;
  }

  // Shayari
  let created = 0;
  for (const s of SHAYARI) {
    const slug = toSlug(s.title);
    const exists = await Shayari.findOne({ slug });
    if (exists) continue;
    await Shayari.create({
      title: s.title,
      slug,
      content: s.content,
      excerpt: s.content.slice(0, 160),
      category: catMap[s.cat]._id,
      author: authorMap[s.author]._id,
      language: langMap[s.lang]._id,
      tags: s.tags.map((t) => tagMap[t]._id),
      status: STATUS.PUBLISHED,
      publishedAt: new Date(),
      featured: Math.random() > 0.5,
      readingTime: calcReadingTime(s.content),
      views: Math.floor(Math.random() * 500),
      likes: Math.floor(Math.random() * 120),
      createdBy: admin._id,
    });
    created += 1;
  }

  // Refresh denormalized counts
  for (const cat of Object.values(catMap)) {
    const count = await Shayari.countDocuments({ category: cat._id });
    await Category.findByIdAndUpdate(cat._id, { shayariCount: count });
  }
  for (const tag of Object.values(tagMap)) {
    const count = await Shayari.countDocuments({ tags: tag._id });
    await Tag.findByIdAndUpdate(tag._id, { usageCount: count });
  }

  // SEO singleton + homepage sections
  await SeoSettings.getSingleton();
  const sectionCount = await HomepageSection.countDocuments();
  if (!sectionCount) {
    await HomepageSection.create([
      { title: "Trending Now", type: "trending", layout: "carousel", order: 1, query: { limit: 8 } },
      { title: "Fresh Verses", subtitle: "Latest shayari", type: "latest", layout: "grid", order: 2, query: { limit: 8 } },
      { title: "Editor's Picks", type: "featured", layout: "masonry", order: 3, query: { limit: 6 } },
    ]);
  }

  logger.info(`Seed complete — ${created} new shayari, ${Object.keys(catMap).length} categories.`);
  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
