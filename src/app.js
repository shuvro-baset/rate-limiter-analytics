/**
 * @file app.js
 * @description Express application factory. Configures security, CORS, compression, body parsing,
 *              and mounts all routes. Dashboard and analytics routes are registered before
 *              the global rate limiter so they remain available even if Redis is down.
 *
 * Route order rationale:
 * - Health, analytics, and dashboard are mounted first so they do not depend on rate limiter or Redis.
 * - Request ID, logger, global rate limiter, and analytics logging run for all subsequent routes (e.g. /api).
 *
 * @module app
 */

const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

const requestId = require("./middlewares/requestId");
const loggerMiddleware = require("./middlewares/loggerMiddleware");
const globalRateLimiter = require("./middlewares/globalRateLimiter");
const analyticsMiddleware = require("./middlewares/analyticsMiddleware");

const app = express();

// ------------------
// Core Middlewares
// ------------------
app.use(
  helmet({
    contentSecurityPolicy: false,           // Allow CDN scripts (e.g. Chart.js) and inline styles
    crossOriginResourcePolicy: { policy: "cross-origin" },  // Allow dashboard to load assets
    crossOriginEmbedderPolicy: false,      // Avoid blocking same-origin responses
  })
);
app.use(cors());
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------
// Routes (dashboard + analytics first so they don't depend on rate limiter/Redis)
// ------------------
app.get("/", (req, res) => res.redirect(302, "/dashboard"));

app.get("/health", (req, res) => {
  res.json({ status: "OK", request_id: req.requestId });
});

const analyticsRoutes = require("./routes/analyticsRoutes");
const limiterRoutes = require("./routes/limiterRoutes");

app.use("/analytics", analyticsRoutes);

const dashboardDir = path.join(__dirname, "..", "public", "dashboard");
app.get(["/dashboard", "/dashboard/", "/dashboard/algorithm/:name"], (req, res) => {
  res.sendFile(path.join(dashboardDir, "index.html"));
});
app.use("/dashboard", express.static(dashboardDir));

// ------------------
// Custom Middlewares (apply to API only so dashboard/analytics always work)
// ------------------
app.use(requestId);
app.use(loggerMiddleware);
app.use(globalRateLimiter);
app.use(analyticsMiddleware("global"));
app.use("/api", limiterRoutes);

// ------------------
// Error Handler (JSON for /analytics so dashboard can show message)
// ------------------
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
  });
});

module.exports = app;
