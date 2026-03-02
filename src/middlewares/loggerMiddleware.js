/**
 * @file loggerMiddleware.js
 * @description Logs each request after the response finishes (method, route, status, duration, IP).
 *
 * Purpose:
 * - Audit and debugging: see which routes were hit, status codes, and response time.
 * - Uses res.on("finish") so the final status code and duration are known.
 *
 * Log shape:
 * - request_id, method, route, status, ip, duration_ms (from request start to finish).
 *
 * @module middlewares/loggerMiddleware
 */

const logger = require("../config/logger");

/**
 * Log request summary on response finish.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
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
