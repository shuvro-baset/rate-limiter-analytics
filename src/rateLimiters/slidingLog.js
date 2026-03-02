/**
 * @file slidingLog.js
 * @description Sliding-window log rate limiter. Stores a timestamp per request in a sorted set;
 *              counts only requests within the last windowSize seconds. Accurate but memory-heavy.
 *
 * Why sliding log:
 * - True sliding window: no burst at window boundaries. Fair for clients that spread requests.
 * - Drawback: one Redis key per IP with one entry per request; memory grows with traffic.
 *
 * Redis key: slidinglog:{ip}. Type: ZSET. Score = timestamp (ms). We remove entries older than
 * (now - windowSize*1000), then check count and add current request.
 *
 * @param {Object} options
 * @param {number} [options.windowSize=60] - Window length in seconds.
 * @param {number} [options.maxRequests=10] - Max requests in the sliding window per IP.
 * @returns {import('express').RequestHandler}
 *
 * @module rateLimiters/slidingLog
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
    const key = `slidinglog:${req.ip}`;
    const now = Date.now();
    const windowStart = now - windowSize * 1000;

    await client.zRemRangeByScore(key, 0, windowStart);
    const count = await client.zCard(key);

    if (count >= maxRequests) {
      return res.status(429).json({
        message: "Sliding Log limit exceeded",
      });
    }

    await client.zAdd(key, [{ score: now, value: `${now}` }]);
    await client.expire(key, windowSize);

    next();
  };
};
