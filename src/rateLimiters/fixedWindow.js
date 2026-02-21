const redis = require("redis");

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

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