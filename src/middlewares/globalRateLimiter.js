/**
 * @file globalRateLimiter.js
 * @description Global rate limiter applied to routes that use it (e.g. /api). Uses a single Redis key
 *              to cap total requests per time window across all clients.
 *
 * Why global:
 * - Protects the API from overall abuse even if per-IP or per-algorithm limits are high.
 * - Single key "global:limit" and INCR + EXPIRE keep implementation simple and atomic.
 *
 * Behavior:
 * - First request in a window: INCR key, set EXPIRE to WINDOW seconds.
 * - Subsequent requests: INCR; if count > LIMIT, respond 429 and do not call next().
 * - On Redis error, next() is called (fail open) so the app stays up when Redis is down.
 *
 * Configuration (constants in file):
 * - WINDOW: 60 seconds.
 * - LIMIT: 100 requests per window.
 *
 * @module middlewares/globalRateLimiter
 */

const redisClient = require("../config/redis");

/** @constant {number} Time window in seconds */
const WINDOW = 60;
/** @constant {number} Max requests per window across all IPs */
const LIMIT = 100;

/**
 * Middleware: allow request only if global request count in the current window is <= LIMIT.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = async (req, res, next) => {
  try {
    const key = "global:limit";

    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, WINDOW);
    }

    if (current > LIMIT) {
      return res.status(429).json({
        message: "Global rate limit exceeded",
      });
    }

    next();
  } catch (err) {
    next(); // fail open
  }
};
