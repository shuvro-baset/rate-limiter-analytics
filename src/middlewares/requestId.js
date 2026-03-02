/**
 * @file requestId.js
 * @description Middleware that assigns a unique request ID to each request and sends it in the response header.
 *
 * Purpose:
 * - Trace a single request across logs and services using one ID.
 * - X-Request-ID is a common header for load balancers and clients to correlate requests.
 *
 * Implementation:
 * - Uses UUID v4 for uniqueness and low collision probability.
 * - Attaches id to req.requestId so downstream middleware and route handlers can use it.
 * - Sets X-Request-ID on the response for client-side debugging.
 *
 * @module middlewares/requestId
 */

const { v4: uuidv4 } = require("uuid");

/**
 * Attach a unique request ID to the request and response.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
module.exports = (req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-ID", req.requestId);
  next();
};
