/**
 * @file analyticsRoutes.js
 * @description Express router for analytics API. All routes return JSON and are mounted at /analytics.
 *
 * Routes are registered before the global rate limiter in app.js, so the dashboard can fetch
 * data even when Redis is unavailable. No authentication is applied here; add auth middleware if needed.
 *
 * @module routes/analyticsRoutes
 */

const express = require("express");
const router = express.Router();

const AnalyticsController = require("../controllers/analyticsController");

/** No DB; used by dashboard to check server reachability */
router.get("/ping", (req, res) => res.json({ ok: true }));

/** Total requests and unique IPs; optional ?algorithm= for filter */
router.get("/overall", AnalyticsController.overall);

/** Request count per browser; optional ?algorithm= for filter */
router.get("/browsers", AnalyticsController.browsers);

/** Request count per algorithm (no filter param) */
router.get("/algorithms", AnalyticsController.algorithms);

/** Request count per hour; optional ?algorithm= for filter */
router.get("/hourly", AnalyticsController.hourly);

/** Full stats for one algorithm: overall, browsers, hourly (for dashboard algorithm view) */
router.get("/algorithm/:name", AnalyticsController.algorithmDetails);

module.exports = router;
