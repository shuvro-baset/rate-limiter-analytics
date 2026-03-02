/**
 * @file analyticsMiddleware.js
 * @description Persists each request to request_logs (PostgreSQL) for analytics: IP, browser, OS,
 *              route, method, algorithm type, status, response time, user agent.
 *
 * Purpose:
 * - Feed the analytics dashboard (total requests, unique IPs, browser/algorithm distribution, hourly).
 * - Algorithm type is passed so each rate-limited route can tag requests (e.g. "fixed", "token-bucket").
 *
 * Implementation:
 * - Uses res.on("finish") to log after the response is sent, so status and response time are final.
 * - UAParser parses User-Agent for browser and OS; raw user_agent is also stored.
 * - Logging is fire-and-forget (catch empty); failures should not affect the response.
 *
 * @param {string} [algorithmType='global'] - Algorithm name to store in request_logs (e.g. "fixed", "token-bucket").
 * @returns {import('express').RequestHandler} Middleware function.
 *
 * @module middlewares/analyticsMiddleware
 */

const UAParser = require("ua-parser-js");
const { saveRequestLog } = require("../services/analytics.service");

/**
 * Create analytics middleware that logs the request with the given algorithm type.
 * @param {string} [algorithmType='global'] - Value for algorithm_type in request_logs.
 * @returns {import('express').RequestHandler}
 */
module.exports = (algorithmType = "global") => {
  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", async () => {
      try {
        const parser = new UAParser(req.headers["user-agent"]);

        await saveRequestLog({
          request_id: req.requestId,
          ip: req.ip,
          browser: parser.getBrowser().name,
          os: parser.getOS().name,
          route: req.originalUrl,
          method: req.method,
          algorithm: algorithmType,
          status: res.statusCode,
          responseTime: Date.now() - start,
          userAgent: req.headers["user-agent"],
        });
      } catch {}
    });

    next();
  };
};
