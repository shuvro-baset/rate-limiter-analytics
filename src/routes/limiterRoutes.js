const express = require("express");
const router = express.Router();

const fixed = require("../rateLimiters/fixedWindow");
const slidingLog = require("../rateLimiters/slidingLog");
const slidingCounter = require("../rateLimiters/slidingCounter");
const tokenBucket = require("../rateLimiters/tokenBucket");
const leakyBucket = require("../rateLimiters/leakyBucket");

const analytics = require("../middlewares/analyticsMiddleware");

// Fixed Window
router.get(
  "/fixed",
  fixed({ windowSize: 60, maxRequests: 5 }),
  analytics("fixed"),
  (req, res) => {
    res.json({ message: "Fixed Window Success" });
  }
);

// Sliding Log
router.get(
  "/sliding-log",
  slidingLog({ windowSize: 60, maxRequests: 5 }),
  analytics("sliding-log"),
  (req, res) => {
    res.json({ message: "Sliding Log Success" });
  }
);

// Sliding Counter
router.get(
  "/sliding-counter",
  slidingCounter({ windowSize: 60, maxRequests: 5 }),
  analytics("sliding-counter"),
  (req, res) => {
    res.json({ message: "Sliding Counter Success" });
  }
);

// Token Bucket
router.get(
  "/token-bucket",
  tokenBucket({ capacity: 5, refillRate: 1 }),
  analytics("token-bucket"),
  (req, res) => {
    res.json({ message: "Token Bucket Success" });
  }
);

// Leaky Bucket
router.get(
  "/leaky-bucket",
  leakyBucket({ capacity: 5, leakRate: 1 }),
  analytics("leaky-bucket"),
  (req, res) => {
    res.json({ message: "Leaky Bucket Success" });
  }
);

module.exports = router;