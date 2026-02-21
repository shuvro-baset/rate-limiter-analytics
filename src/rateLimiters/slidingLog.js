const redis = require("redis");

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

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