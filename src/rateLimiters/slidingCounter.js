const redis = require("redis");

const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

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