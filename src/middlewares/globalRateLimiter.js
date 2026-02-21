const redisClient = require("../config/redis");

const WINDOW = 60;
const LIMIT = 100;

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