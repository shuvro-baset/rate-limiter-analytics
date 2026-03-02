/**
 * @file tokenBucket.js
 * @description Token-bucket rate limiter. Each IP has a bucket of tokens; one token is consumed per
 *              request. Tokens refill at refillRate per second up to capacity. Allows bursts up to capacity.
 *
 * Why token bucket:
 * - Smooths traffic over time while allowing short bursts (e.g. 5 requests in 1s if capacity=5).
 * - Refill rate limits sustained throughput; capacity limits burst size.
 *
 * Redis key: tokenbucket:{ip}. Hash: { tokens (float), last (timestamp ms) }. On first use we set
 * tokens=capacity, last=now. Then refill = (now - last)/1000 * refillRate; newTokens = min(capacity, tokens + refill).
 * If newTokens < 1 we reject; else consume one token and store new state.
 *
 * @param {Object} options
 * @param {number} [options.capacity=10] - Max tokens in the bucket (burst size).
 * @param {number} [options.refillRate=1] - Tokens added per second.
 * @returns {import('express').RequestHandler}
 *
 * @module rateLimiters/tokenBucket
 */

const redis = require("redis");

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

/**
 * @param {{ capacity?: number, refillRate?: number }} options
 * @returns {import('express').RequestHandler}
 */
module.exports = ({ capacity = 10, refillRate = 1 }) => {
  return async (req, res, next) => {
    const key = `tokenbucket:${req.ip}`;
    const now = Date.now();

    let bucket = await client.hGetAll(key);

    if (!bucket.tokens) {
      bucket = { tokens: capacity, last: now };
    }

    const tokens = parseFloat(bucket.tokens);
    const last = parseFloat(bucket.last);

    const delta = (now - last) / 1000;
    const refill = delta * refillRate;
    let newTokens = Math.min(capacity, tokens + refill);

    if (newTokens < 1) {
      return res.status(429).json({
        message: "Token Bucket limit exceeded",
      });
    }

    newTokens -= 1;

    await client.hSet(key, {
      tokens: newTokens,
      last: now,
    });

    next();
  };
};
