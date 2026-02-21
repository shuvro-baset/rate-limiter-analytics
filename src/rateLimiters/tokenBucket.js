const redis = require("redis");

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

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