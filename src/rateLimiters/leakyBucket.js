/**
 * @file leakyBucket.js
 * @description Leaky-bucket rate limiter. Requests add "water" to the bucket; water "leaks" at leakRate
 *              per second. Request is allowed only if water + 1 does not exceed capacity. Smooths traffic.
 *
 * Why leaky bucket:
 * - Output rate is bounded by leakRate (requests leave the bucket at a steady rate). Good for
 *   smoothing bursty input into a steady stream. No refill of tokens; only leak of accumulated water.
 *
 * Redis key: leaky:{ip}. Hash: { water (float), last (timestamp ms) }. On first use water=0, last=now.
 * leaked = (now - last)/1000 * leakRate; newWater = max(0, water - leaked). If newWater + 1 > capacity, reject;
 * else set water = newWater + 1, last = now.
 *
 * @param {Object} options
 * @param {number} [options.capacity=10] - Max water (bucket size).
 * @param {number} [options.leakRate=1] - Water leaked per second.
 * @returns {import('express').RequestHandler}
 *
 * @module rateLimiters/leakyBucket
 */

const redis = require("redis");

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

/**
 * @param {{ capacity?: number, leakRate?: number }} options
 * @returns {import('express').RequestHandler}
 */
module.exports = ({ capacity = 10, leakRate = 1 }) => {
  return async (req, res, next) => {
    const key = `leaky:${req.ip}`;
    const now = Date.now();

    let bucket = await client.hGetAll(key);

    if (!bucket.water) {
      bucket = { water: 0, last: now };
    }

    const water = parseFloat(bucket.water);
    const last = parseFloat(bucket.last);

    const leaked = ((now - last) / 1000) * leakRate;
    const newWater = Math.max(0, water - leaked);

    if (newWater + 1 > capacity) {
      return res.status(429).json({
        message: "Leaky Bucket limit exceeded",
      });
    }

    await client.hSet(key, {
      water: newWater + 1,
      last: now,
    });

    next();
  };
};
