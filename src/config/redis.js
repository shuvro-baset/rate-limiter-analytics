/**
 * @file redis.js
 * @description Redis client used by rate limiters and the global rate limiter.
 *
 * Why Redis:
 * - Rate limiting requires fast, shared counters across app instances; Redis provides atomic ops (INCR, EXPIRE, etc.).
 * - Socket config (host/port) is used here; rate limiter modules may use REDIS_URL for createClient({ url }).
 *
 * Environment variables (from .env):
 * - REDIS_HOST: Redis server host (e.g. localhost or redis in Docker).
 * - REDIS_PORT: Redis port (default 6379).
 *
 * Note: connect() is called at load time. If Redis is unavailable, the app may throw on first use;
 * global rate limiter fails open (calls next()) on Redis errors so the API stays available.
 *
 * @module config/redis
 */

const { createClient } = require("redis");
require("dotenv").config();

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.connect();

module.exports = redisClient;
