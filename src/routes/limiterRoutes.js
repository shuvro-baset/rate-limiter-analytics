/**
 * @file limiterRoutes.js
 * @description Rate-limited demo routes. Each route uses a different algorithm and the analytics
 *              middleware to tag and log requests. Mounted at /api.
 *
 * Order per route: rate limiter -> analytics middleware -> handler. The limiter runs first so
 * rejected requests (429) are not logged as successful; analytics still runs for allowed requests.
 *
 * Configuration (tunable in each route):
 * - Window-based: windowSize (seconds), maxRequests.
 * - Token bucket: capacity, refillRate (tokens per second).
 * - Leaky bucket: capacity, leakRate (drops per second).
 *
 * @module routes/limiterRoutes
 */

const express = require("express");
const router = express.Router();

const fixed = require("../rateLimiters/fixedWindow");
const slidingLog = require("../rateLimiters/slidingLog");
const slidingCounter = require("../rateLimiters/slidingCounter");
const tokenBucket = require("../rateLimiters/tokenBucket");
const leakyBucket = require("../rateLimiters/leakyBucket");

const analytics = require("../middlewares/analyticsMiddleware");

router.get(
  "/fixed",
  fixed({ windowSize: 60, maxRequests: 5 }),
  analytics("fixed"),
  (req, res) => {
    res.json({ message: "Fixed Window Success" });
  }
);

router.get(
  "/sliding-log",
  slidingLog({ windowSize: 60, maxRequests: 5 }),
  analytics("sliding-log"),
  (req, res) => {
    res.json({ message: "Sliding Log Success" });
  }
);

router.get(
  "/sliding-counter",
  slidingCounter({ windowSize: 60, maxRequests: 5 }),
  analytics("sliding-counter"),
  (req, res) => {
    res.json({ message: "Sliding Counter Success" });
  }
);

router.get(
  "/token-bucket",
  tokenBucket({ capacity: 5, refillRate: 1 }),
  analytics("token-bucket"),
  (req, res) => {
    res.json({ message: "Token Bucket Success" });
  }
);

router.get(
  "/leaky-bucket",
  leakyBucket({ capacity: 5, leakRate: 1 }),
  analytics("leaky-bucket"),
  (req, res) => {
    res.json({ message: "Leaky Bucket Success" });
  }
);

module.exports = router;
