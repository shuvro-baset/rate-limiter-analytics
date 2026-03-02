/**
 * @file fixedWindow.js
 * @description Fixed-window rate limiter. Counts requests per IP in fixed time windows (e.g. 0–60s, 60–120s).
 *              Simple and fast; can allow a burst at the start of each new window.
 *
 * Why fixed window:
 * - Minimal Redis ops: INCR + EXPIRE on first request in window. Easy to reason about and deploy.
 * - Drawback: if limit is 5 and window 60s, a client can send 5 at 59s and 5 at 61s (10 in 2s).
 *
 * Redis key: fixed:{ip}. Value: count. TTL: windowSize seconds (set when count goes 0→1).
 *
 * @param {Object} options
 * @param {number} [options.windowSize=60] - Window length in seconds.
 * @param {number} [options.maxRequests=10] - Max requests per window per IP.
 * @returns {import('express').RequestHandler}
 *
 * @module rateLimiters/fixedWindow
 */

const redis = require("redis");

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

/**
 * @param {{ windowSize?: number, maxRequests?: number }} options
 * @returns {import('express').RequestHandler}
 */
module.exports = ({ windowSize = 60, maxRequests = 10 }) => {
  return async (req, res, next) => {
    const key = `fixed:${req.ip}`;
    const current = await client.incr(key);

    if (current === 1) {
      await client.expire(key, windowSize);
    }

    if (current > maxRequests) {
      return res.status(429).json({
        message: "Fixed Window limit exceeded",
      });
    }

    next();
  };
};
