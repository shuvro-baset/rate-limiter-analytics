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