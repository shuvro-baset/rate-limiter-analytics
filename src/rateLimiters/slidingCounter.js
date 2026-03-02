/**
 * @file slidingCounter.js
 * @description Sliding-window counter (hybrid). Uses two fixed windows and a weighted count to
 *              approximate a sliding window with O(1) memory per IP. Good balance of accuracy and cost.
 *
 * Why sliding counter:
 * - More accurate than fixed window at boundaries (weighted overlap) without storing every timestamp.
 * - Formula: total = current_window_count + previous_window_count * (1 - weight), where weight is
 *   the fraction of the current window elapsed. If total > maxRequests, reject.
 *
 * Redis: two keys per IP, slidingcounter:{ip}:{currentWindow} and :{prevWindow}. Value = count.
 * TTL on current window key = windowSize*2 so the previous window key can expire after use.
 *
 * @param {Object} options
 * @param {number} [options.windowSize=60] - Window length in seconds.
 * @param {number} [options.maxRequests=10] - Max requests in the approximated sliding window per IP.
 * @returns {import('express').RequestHandler}
 *
 * @module rateLimiters/slidingCounter
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
    const currentWindow = Math.floor(Date.now() / 1000 / windowSize);
    const prevWindow = currentWindow - 1;

    const keyCurrent = `slidingcounter:${req.ip}:${currentWindow}`;
    const keyPrev = `slidingcounter:${req.ip}:${prevWindow}`;

    const [currentCount, prevCount] = await Promise.all([
      client.incr(keyCurrent),
      client.get(keyPrev),
    ]);

    await client.expire(keyCurrent, windowSize * 2);

    const weight = (Date.now() % (windowSize * 1000)) / (windowSize * 1000);
    const total =
      currentCount + (prevCount ? prevCount * (1 - weight) : 0);

    if (total > maxRequests) {
      return res.status(429).json({
        message: "Sliding Counter limit exceeded",
      });
    }

    next();
  };
};
