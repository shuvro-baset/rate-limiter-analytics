/**
 * @file analyticsController.js
 * @description HTTP layer for analytics. Reads query/params, calls AnalyticsService, and sends JSON.
 *              Errors are passed to next() for the global error handler (JSON response).
 *
 * Query parameter:
 * - algorithm: optional; when present, all aggregations are filtered by algorithm_type = algorithm.
 *
 * @module controllers/analyticsController
 */

const AnalyticsService = require("../services/analyticsService");

/** Query param name for optional algorithm filter */
const ALGORITHM_PARAM = "algorithm";

class AnalyticsController {
  /**
   * GET /analytics/overall
   * Returns total request count and unique IP count, optionally filtered by algorithm.
   * @param {import('express').Request} req - req.query.algorithm optional
   * @param {import('express').Response} res - JSON: { total_requests, unique_ips }
   * @param {import('express').NextFunction} next
   */
  static async overall(req, res, next) {
    try {
      const algorithm = req.query[ALGORITHM_PARAM] || null;
      const data = await AnalyticsService.getOverallStats(algorithm);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/browsers
   * Returns request count per browser (browser_name), optionally filtered by algorithm.
   * @param {import('express').Request} req - req.query.algorithm optional
   * @param {import('express').Response} res - JSON: [{ browser, total }, ...]
   * @param {import('express').NextFunction} next
   */
  static async browsers(req, res, next) {
    try {
      const algorithm = req.query[ALGORITHM_PARAM] || null;
      const data = await AnalyticsService.getBrowserStats(algorithm);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/algorithms
   * Returns request count per algorithm_type (no filter param).
   * @param {import('express').Request} req
   * @param {import('express').Response} res - JSON: [{ algorithm, total }, ...]
   * @param {import('express').NextFunction} next
   */
  static async algorithms(req, res, next) {
    try {
      const data = await AnalyticsService.getAlgorithmStats();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/hourly
   * Returns request count per hour (DATE_TRUNC('hour', created_at)), optionally filtered by algorithm.
   * @param {import('express').Request} req - req.query.algorithm optional
   * @param {import('express').Response} res - JSON: [{ hour, total }, ...]
   * @param {import('express').NextFunction} next
   */
  static async hourly(req, res, next) {
    try {
      const algorithm = req.query[ALGORITHM_PARAM] || null;
      const data = await AnalyticsService.getHourlyStats(algorithm);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /analytics/algorithm/:name
   * Returns full analytics for one algorithm: overall, browsers, hourly, and algorithm name.
   * Used by the dashboard algorithm-specific view.
   * @param {import('express').Request} req - req.params.name = algorithm identifier
   * @param {import('express').Response} res - JSON: { overall, browsers, hourly, algorithm }
   * @param {import('express').NextFunction} next
   */
  static async algorithmDetails(req, res, next) {
    try {
      const { name } = req.params;
      const data = await AnalyticsService.getAlgorithmDetails(name);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AnalyticsController;
