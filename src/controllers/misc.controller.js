import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { analyticsService } from "../services/analytics.service.js";
import { mediaService } from "../services/media.service.js";
import { adService, homepageService, seoService } from "../services/settings.service.js";
import { seoFeedService } from "../services/seo.service.js";
import { recordAudit } from "../middlewares/audit.middleware.js";
import { AUDIT_ACTIONS } from "../constants/index.js";

/* -------- Analytics -------- */
export const analyticsController = {
  dashboard: asyncHandler(async (_req, res) => {
    const data = await analyticsService.dashboard();
    return ApiResponse.ok(res, data, "Dashboard analytics");
  }),
  views: asyncHandler(async (req, res) => {
    const data = await analyticsService.timeseries(Number(req.query.days) || 30);
    return ApiResponse.ok(res, data, "Views timeseries");
  }),
  popular: asyncHandler(async (req, res) => {
    const data = await analyticsService.popular({ metric: req.query.metric, limit: Number(req.query.limit) || 10 });
    return ApiResponse.ok(res, data, "Popular shayari");
  }),
};

/* -------- Media -------- */
export const mediaController = {
  upload: asyncHandler(async (req, res) => {
    const media = await mediaService.saveUploaded(req.file, req.user._id);
    recordAudit(req, { action: AUDIT_ACTIONS.CREATE, entity: "Media", entityId: media._id, description: "Uploaded media" });
    return ApiResponse.created(res, media, "Uploaded");
  }),
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await mediaService.list(req.query);
    return ApiResponse.ok(res, items, "Media library", meta);
  }),
  remove: asyncHandler(async (req, res) => {
    await mediaService.remove(req.params.id);
    return ApiResponse.ok(res, null, "Media deleted");
  }),
};

/* -------- Ads -------- */
export const adController = {
  publicList: asyncHandler(async (req, res) => {
    const data = await adService.listActive(req.query.slot);
    return ApiResponse.ok(res, data, "Active ads");
  }),
  adminList: asyncHandler(async (req, res) => {
    const { items, meta } = await adService.adminList(req.query);
    return ApiResponse.ok(res, items, "Ads", meta);
  }),
  create: asyncHandler(async (req, res) => {
    const ad = await adService.create(req.body);
    return ApiResponse.created(res, ad, "Ad created");
  }),
  update: asyncHandler(async (req, res) => {
    const ad = await adService.update(req.params.id, req.body);
    return ApiResponse.ok(res, ad, "Ad updated");
  }),
  remove: asyncHandler(async (req, res) => {
    await adService.remove(req.params.id);
    return ApiResponse.ok(res, null, "Ad deleted");
  }),
  click: asyncHandler(async (req, res) => {
    await adService.recordClick(req.params.id);
    return ApiResponse.ok(res, null, "Click recorded");
  }),
};

/* -------- Homepage sections -------- */
export const homepageController = {
  publicLayout: asyncHandler(async (_req, res) => {
    const data = await homepageService.publicLayout();
    return ApiResponse.ok(res, data, "Homepage layout");
  }),
  adminList: asyncHandler(async (_req, res) => {
    const data = await homepageService.adminList();
    return ApiResponse.ok(res, data, "Homepage sections");
  }),
  create: asyncHandler(async (req, res) => {
    const data = await homepageService.create(req.body);
    return ApiResponse.created(res, data, "Section created");
  }),
  update: asyncHandler(async (req, res) => {
    const data = await homepageService.update(req.params.id, req.body);
    return ApiResponse.ok(res, data, "Section updated");
  }),
  remove: asyncHandler(async (req, res) => {
    await homepageService.remove(req.params.id);
    return ApiResponse.ok(res, null, "Section deleted");
  }),
  reorder: asyncHandler(async (req, res) => {
    const data = await homepageService.reorder(req.body.order);
    return ApiResponse.ok(res, data, "Sections reordered");
  }),
};

/* -------- SEO settings + feeds -------- */
export const seoController = {
  get: asyncHandler(async (_req, res) => {
    const data = await seoService.get();
    return ApiResponse.ok(res, data, "SEO settings");
  }),
  update: asyncHandler(async (req, res) => {
    const data = await seoService.update(req.body);
    recordAudit(req, { action: AUDIT_ACTIONS.UPDATE, entity: "SeoSettings", description: "Updated SEO settings" });
    return ApiResponse.ok(res, data, "SEO settings updated");
  }),
  robots: asyncHandler(async (_req, res) => {
    const txt = await seoFeedService.robots();
    res.type("text/plain").send(txt);
  }),
  sitemap: asyncHandler(async (_req, res) => {
    const xml = await seoFeedService.sitemap();
    res.type("application/xml").send(xml);
  }),
  rss: asyncHandler(async (_req, res) => {
    const xml = await seoFeedService.rss();
    res.type("application/rss+xml").send(xml);
  }),
};
