/**
 * @file analytics.service.js
 * @description Writes a single request log row to request_logs. Used by analyticsMiddleware after
 *              each request (on res "finish") to persist IP, browser, OS, route, method, algorithm,
 *              status, response time, and user agent.
 *
 * Why separate from analyticsService.js:
 * - analyticsService.js is read-only aggregates for the dashboard; this file is the write path.
 * - Keeps insert logic and column mapping in one place for consistency with the migrations.
 *
 * @module services/analytics.service
 */

const pool = require("../config/db");

/**
 * Insert one row into request_logs. All fields are required by the INSERT; caller must provide
 * request_id, ip, browser, os, route, method, algorithm, status, responseTime, userAgent.
 *
 * @param {Object} data - Request log payload from analyticsMiddleware.
 * @param {string} data.request_id - Unique request ID (e.g. UUID).
 * @param {string} data.ip - Client IP.
 * @param {string} [data.browser] - Parsed browser name (UAParser).
 * @param {string} [data.os] - Parsed OS name (UAParser).
 * @param {string} data.route - req.originalUrl.
 * @param {string} data.method - HTTP method.
 * @param {string} data.algorithm - Algorithm tag (e.g. "fixed", "token-bucket").
 * @param {number} data.status - HTTP status code (res.statusCode).
 * @param {number} data.responseTime - Milliseconds from request start to finish.
 * @param {string} [data.userAgent] - Raw User-Agent header.
 * @returns {Promise<void>}
 */
const saveRequestLog = async (data) => {
  const query = `
    INSERT INTO request_logs
    (request_id, ip_address, browser_name, os, route, method, algorithm_type, status_code, response_time_ms,
     user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `;

  await pool.query(query, [
    data.request_id,
    data.ip,
    data.browser,
    data.os,
    data.route,
    data.method,
    data.algorithm,
    data.status,
    data.responseTime,
    data.userAgent,
  ]);
};

module.exports = { saveRequestLog };
