const logger = require("../config/logger");

module.exports = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    logger.info({
      request_id: req.requestId,
      method: req.method,
      route: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      duration_ms: Date.now() - start,
    });
  });

  next();
};