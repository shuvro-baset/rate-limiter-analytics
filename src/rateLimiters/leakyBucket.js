const redis = require("redis");

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

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