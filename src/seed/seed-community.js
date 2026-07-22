/* eslint-disable no-console */
/**
 * Community seed — inserts a set of shayari, each authored by a DIFFERENT user,
 * so the site shows varied writer names (via `createdBy`) instead of one admin.
 *
 * Run:
 *   npm run seed:community            # insert (idempotent — safe to re-run)
 *   npm run seed:community -- --destroy  # remove ONLY what this script created
 *
 * Which database it writes to:
 *   It uses the SAME connection as the app (config/db.js), i.e. MONGODB_URI.
 *   - Local .env  -> your local/dev DB (won't show on the live site).
 *   - To seed the LIVE site, run with the production URI, e.g.:
 *       MONGODB_URI="<prod-mongodb-uri>" npm run seed:community
 *     (the db.js guard still blocks the company `revv-staging` cluster).
 *
 * To use your OWN shayari: replace the objects in the SHAYARI array below.
 * `by` is an index into the USERS array (which user "wrote" that shayari).
 */
import env from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import logger from "../config/logger.js";
import { User, Category, Tag, Language, Shayari } from "../models/index.js";
import { toSlug, uniqueSlug } from "../utils/slug.js";
import { calcReadingTime } from "../utils/readingTime.js";
import { ROLES, STATUS, USER_STATUS } from "../constants/index.js";

// A tag stamped on every doc this script creates, so --destroy can clean up
// precisely without touching hand-written or admin-seeded content.
const SEED_MARK = "community-seed";

// ---------------------------------------------------------------------------
// 1) The users whose names will appear as authors.
// ---------------------------------------------------------------------------
const DEFAULT_PASSWORD = process.env.SEED_COMMUNITY_PASSWORD || "Shayari@12345";

const USERS = [
  { name: "Aarav Sharma", email: "aarav.sharma@shayari-community.app" },
  { name: "Priya Verma", email: "priya.verma@shayari-community.app" },
  { name: "Rohan Mehta", email: "rohan.mehta@shayari-community.app" },
  { name: "Sneha Iyer", email: "sneha.iyer@shayari-community.app" },
  { name: "Kabir Khan", email: "kabir.khan@shayari-community.app" },
  { name: "Ananya Reddy", email: "ananya.reddy@shayari-community.app" },
  { name: "Vikram Singh", email: "vikram.singh@shayari-community.app" },
  { name: "Zoya Ansari", email: "zoya.ansari@shayari-community.app" },
];

// ---------------------------------------------------------------------------
// 2) The shayari. `by` = index into USERS. `cat` must match a category below.
//    Replace this whole array with your own content whenever you like.
// ---------------------------------------------------------------------------
const SHAYARI = [
  { title: "Hans Kar Jeena", content: "हंसकर जीना ही दस्तूर है ज़िंदगी का,\nएक यही किस्सा मशहूर है ज़िंदगी का।", cat: "Life", tags: ["zindagi", "khushi"], lang: "hi", by: 0 },
  { title: "Jeet Aur Haar", content: "ज़िंदगी में जीत और हार हमारी सोच बनाती है,\nजो मान लेता है वह हार जाता है, जब ठान लेता है वह जीत जाता है।", cat: "Motivational", tags: ["zindagi", "umeed"], lang: "hi", by: 1 },
  { title: "Sapno Ki Manzil", content: "सपनों की मंज़िल पास नहीं होती,\nज़िंदगी हर पल उदास नहीं होती।", cat: "Motivational", tags: ["umeed", "zindagi"], lang: "hi", by: 2 },
  { title: "Chhoti Si Zindagi", content: "छोटी सी है ज़िंदगी हंस के जियो, भुला के सारे ग़म दिल से जियो,\nउदासी में क्या रखा है मुस्कुरा के जियो, अपने लिए न सही अपनों के लिए जियो।", cat: "Life", tags: ["zindagi", "khushi"], lang: "hi", by: 3 },
  { title: "Zindagi Sikhati Hai", content: "ज़िंदगी बहुत कुछ सिखाती है, कभी हंसाती है तो कभी रुलाती है,\nपर जो हर हाल में खुश रहते हैं, ज़िंदगी उनके आगे सिर झुकाती है।", cat: "Life", tags: ["zindagi", "umeed"], lang: "hi", by: 4 },
  { title: "Ek Pehchaan", content: "एक पहचान हज़ारों मित्र बना देती है,\nएक मुस्कुराहट हज़ारों दुख भुला देती है।", cat: "Friendship", tags: ["dosti", "khushi"], lang: "hi", by: 5 },
  { title: "Muskura Ke Jeena", content: "ज़िंदगी जब भी आपको रुलाने लगे, आप इतना मुस्कुराओ कि दर्द भी शर्माने लगे,\nनिकले न आंसू आंखों से कभी, किस्मत भी मजबूर होकर आपको हंसाने लगे।", cat: "Life", tags: ["zindagi", "khushi"], lang: "hi", by: 6 },
  { title: "Zindagi Zabardast", content: "ज़िंदगी ज़बरदस्त है इससे बेपनाह प्यार करो,\nहर दुख के बाद सुख का इंतज़ार करो।", cat: "Motivational", tags: ["umeed", "zindagi"], lang: "hi", by: 7 },
  { title: "Taqdeer", content: "फर्क होता है खुदा और फ़क़ीर में, फर्क होता है किस्मत और लकीर में,\nअगर कुछ चाहो और न मिले तो समझ लेना, कि कुछ और अच्छा लिखा है तक़दीर में।", cat: "Life", tags: ["umeed", "zindagi"], lang: "hi", by: 0 },
  { title: "Aarzu Aur Hausla", content: "कुछ तो आरज़ू रख, थोड़ा हौसला रख,\nज़िंदगी जीने का अपना तरीका रख।", cat: "Motivational", tags: ["umeed"], lang: "hi", by: 1 },
  { title: "Rait Si Zindagi", content: "ज़िंदगी हर पल ढलती है, जैसे बंद मुट्ठी से रेत फिसलती है,\nशिकवे कितने भी हों दिल में, फिर भी हंसते रहना, क्योंकि ये ज़िंदगी जैसी भी है, बस एक बार ही मिलती है।", cat: "Life", tags: ["zindagi", "umeed"], lang: "hi", by: 2 },
  { title: "Zindagi Ki Kitaab", content: "ज़िंदगी की किताब में इतनी गलतियां ना करो,\nकि पेंसिल से पहले रबड़ खत्म हो जाए, और तौबा करने से पहले ज़िंदगी खत्म हो जाए।", cat: "Life", tags: ["zindagi"], lang: "hi", by: 3 },
  { title: "Nazariya Badal", content: "नज़रिया बदल के देख, हर तरफ नज़राने मिलेंगे,\nऐ ज़िंदगी यहां तेरी तकलीफों के भी दीवाने मिलेंगे।", cat: "Motivational", tags: ["umeed", "zindagi"], lang: "hi", by: 4 },
  { title: "Dost Uski Dawa", content: "ज़िंदगी एक फूल है तो मोहब्बत उसकी खुशबू है, प्यार एक दरिया है तो महबूब उसका साहिल है,\nअगर ज़िंदगी एक दर्द है तो दोस्त उसकी दवा है।", cat: "Friendship", tags: ["dosti", "mohabbat"], lang: "hi", by: 5 },
  { title: "Zindagi Ka Aanand", content: "क्या खूब कहा है किसी ने, नादान इंसान ही ज़िंदगी का आनंद लेता है,\nज्यादा होशियार तो हमेशा उलझा हुआ रहता है।", cat: "Life", tags: ["zindagi", "khushi"], lang: "hi", by: 6 },
];

// Supporting reference data (upserted; reused if it already exists).
const CATEGORIES = [
  { name: "Love", icon: "💗", color: "#ec4899", description: "Shayari about love and longing" },
  { name: "Sad", icon: "🥀", color: "#64748b", description: "Melancholy and heartbreak" },
  { name: "Motivational", icon: "🔥", color: "#f59e0b", description: "Words that lift you up" },
  { name: "Friendship", icon: "🤝", color: "#10b981", description: "Dosti and bonds" },
  { name: "Life", icon: "🌱", color: "#8b5cf6", description: "Reflections on life" },
];
const LANGUAGES = [
  { name: "Hindi", code: "hi", nativeName: "हिन्दी", order: 1 },
  { name: "Urdu", code: "ur", nativeName: "اردو", direction: "rtl", order: 2 },
  { name: "English", code: "en", nativeName: "English", order: 3 },
];

const run = async () => {
  const destroy = process.argv.includes("--destroy");
  await connectDB();

  if (destroy) {
    const emails = USERS.map((u) => u.email);
    const users = await User.find({ email: { $in: emails } }).select("_id");
    const userIds = users.map((u) => u._id);
    const del = await Shayari.deleteMany({ createdBy: { $in: userIds }, seoKeywords: SEED_MARK });
    await User.deleteMany({ email: { $in: emails } });
    logger.warn(`Community seed destroyed: ${del.deletedCount} shayari + ${userIds.length} users removed.`);
    await disconnectDB();
    process.exit(0);
  }

  // Reference data (idempotent upserts).
  const langMap = {};
  for (const l of LANGUAGES) {
    langMap[l.code] = await Language.findOneAndUpdate(
      { code: l.code },
      { ...l, slug: toSlug(l.name) },
      { upsert: true, new: true }
    );
  }
  const catMap = {};
  for (const c of CATEGORIES) {
    catMap[c.name] = await Category.findOneAndUpdate(
      { name: c.name },
      { ...c, slug: toSlug(c.name) },
      { upsert: true, new: true }
    );
  }
  const tagMap = {};
  const allTags = [...new Set(SHAYARI.flatMap((s) => s.tags))];
  for (const t of allTags) {
    tagMap[t] = await Tag.findOneAndUpdate({ name: t }, { name: t, slug: toSlug(t) }, { upsert: true, new: true });
  }

  // Users — use create() (not upsert) so the password pre-save hook hashes it.
  const userDocs = [];
  for (const u of USERS) {
    let doc = await User.findOne({ email: u.email });
    if (!doc) {
      doc = await User.create({
        name: u.name,
        email: u.email,
        password: DEFAULT_PASSWORD,
        role: ROLES.USER,
        status: USER_STATUS.ACTIVE,
        isEmailVerified: true,
      });
      logger.info(`Created user: ${doc.name} <${doc.email}>`);
    }
    userDocs.push(doc);
  }

  // Shayari — each assigned to its author user via `createdBy`.
  let created = 0;
  let skipped = 0;
  for (let i = 0; i < SHAYARI.length; i++) {
    const s = SHAYARI[i];
    const author = userDocs[s.by];
    if (!author) throw new Error(`SHAYARI[${i}] "${s.title}" has invalid \`by\` index ${s.by}`);
    if (!catMap[s.cat]) throw new Error(`SHAYARI[${i}] "${s.title}" has unknown category "${s.cat}"`);

    if (await Shayari.findOne({ title: s.title })) {
      skipped += 1;
      continue;
    }

    const slug = await uniqueSlug(s.title, async (candidate) => Boolean(await Shayari.findOne({ slug: candidate })));
    // Stagger publish times so "latest" ordering looks natural.
    const publishedAt = new Date(Date.now() - i * 6 * 60 * 60 * 1000);

    await Shayari.create({
      title: s.title,
      slug,
      content: s.content,
      excerpt: s.content.replace(/\n/g, " ").slice(0, 160),
      category: catMap[s.cat]._id,
      language: langMap[s.lang]?._id,
      tags: s.tags.map((t) => tagMap[t]._id),
      createdBy: author._id, // <-- the differing author name comes from here
      status: STATUS.PUBLISHED,
      publishedAt,
      featured: i % 4 === 0,
      trending: i % 5 === 0,
      readingTime: calcReadingTime(s.content),
      views: 50 + Math.floor(Math.random() * 800),
      likes: 5 + Math.floor(Math.random() * 200),
      seoKeywords: [SEED_MARK], // marker for safe --destroy
    });
    created += 1;
  }

  // Refresh denormalized counts.
  for (const cat of Object.values(catMap)) {
    const count = await Shayari.countDocuments({ category: cat._id });
    await Category.findByIdAndUpdate(cat._id, { shayariCount: count });
  }
  for (const tag of Object.values(tagMap)) {
    const count = await Shayari.countDocuments({ tags: tag._id });
    await Tag.findByIdAndUpdate(tag._id, { usageCount: count });
  }

  logger.info(
    `Community seed complete — ${created} new shayari across ${userDocs.length} users` +
      (skipped ? `, ${skipped} skipped (already existed).` : ".")
  );
  logger.info(`Login for any seeded user: <email above> / ${DEFAULT_PASSWORD}`);
  logger.info(`Connected DB: ${env.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")}`);
  await disconnectDB();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
