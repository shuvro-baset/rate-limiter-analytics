/**
 * @file analyticsService.js
 * @description Data access for analytics: aggregates over request_logs (counts, groups by browser,
 *              algorithm, hour). All methods accept an optional algorithm filter to restrict to one algorithm_type.
 *
 * Why parameterized queries:
 * - algorithm is injected via $1 to avoid SQL injection; _algorithmFilter and _params keep the pattern consistent.
 *
 * Return shapes:
 * - getOverallStats: { total_requests: string, unique_ips: string } (bigint as string for JS).
 * - getBrowserStats / getAlgorithmStats: [{ browser|algorithm, total }, ...].
 * - getHourlyStats: [{ hour, total }, ...].
 * - getAlgorithmDetails: { overall, browsers, hourly, algorithm }.
 *
 * @module services/analyticsService
 */

const pool = require("../config/db");

class AnalyticsService {
  /**
   * Builds WHERE clause for algorithm_type when algorithm is provided.
   * @private
   * @param {string|null} algorithm
   * @returns {string} "" or "WHERE algorithm_type = $1"
   */
  static _algorithmFilter(algorithm) {
    return algorithm ? "WHERE algorithm_type = $1" : "";
  }

  /**
   * Returns query params array for the algorithm filter (for pg).
   * @private
   * @param {string|null} algorithm
   * @returns {string[]}
   */
  static _params(algorithm) {
    return algorithm ? [algorithm] : [];
  }

  /**
   * Total request count and distinct IP count, optionally for one algorithm.
   * @param {string|null} [algorithm=null] - If set, only rows with this algorithm_type are counted.
   * @returns {Promise<{ total_requests: string, unique_ips: string }>}
   */
  static async getOverallStats(algorithm = null) {
    const where = this._algorithmFilter(algorithm);
    const { rows } = await pool.query(
      `
      SELECT 
        COUNT(*)::bigint as total_requests,
        COUNT(DISTINCT ip_address)::bigint as unique_ips
      FROM request_logs
      ${where}
    `,
      this._params(algorithm)
    );

    return {
      total_requests: String(rows[0]?.total_requests ?? 0),
      unique_ips: String(rows[0]?.unique_ips ?? 0),
    };
  }

  /**
   * Request count grouped by browser_name. COALESCE(browser_name, 'Unknown') for nulls.
   * @param {string|null} [algorithm=null] - If set, filter by algorithm_type.
   * @returns {Promise<Array<{ browser: string, total: number }>>}
   */
  static async getBrowserStats(algorithm = null) {
    const where = this._algorithmFilter(algorithm);
    const { rows } = await pool.query(
      `
      SELECT 
        COALESCE(browser_name, 'Unknown') as browser,
        COUNT(*)::bigint as total
      FROM request_logs
      ${where}
      GROUP BY browser_name
      ORDER BY total DESC
    `,
      this._params(algorithm)
    );

    return rows.map((r) => ({ browser: r.browser, total: Number(r.total) }));
  }

  /**
   * Request count grouped by algorithm_type. No filter param (all algorithms).
   * @returns {Promise<Array<{ algorithm: string, total: number }>>}
   */
  static async getAlgorithmStats() {
    const { rows } = await pool.query(`
      SELECT 
        algorithm_type as algorithm,
        COUNT(*)::bigint as total
      FROM request_logs
      GROUP BY algorithm_type
      ORDER BY total DESC
    `);

    return rows.map((r) => ({ algorithm: r.algorithm, total: Number(r.total) }));
  }

  /**
   * Request count per hour (DATE_TRUNC('hour', created_at)), optionally for one algorithm.
   * @param {string|null} [algorithm=null] - If set, filter by algorithm_type.
   * @returns {Promise<Array<{ hour: any, total: number }>>}
   */
  static async getHourlyStats(algorithm = null) {
    const where = this._algorithmFilter(algorithm);
    const { rows } = await pool.query(
      `
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*)::bigint as total
      FROM request_logs
      ${where}
      GROUP BY hour
      ORDER BY hour ASC
    `,
      this._params(algorithm)
    );

    return rows.map((r) => ({
      hour: r.hour,
      total: Number(r.total),
    }));
  }

  /**
   * Full analytics for one algorithm: overall stats, browser stats, and hourly stats in one response.
   * @param {string} algorithm - algorithm_type value (e.g. "fixed", "token-bucket").
   * @returns {Promise<{ overall: object, browsers: array, hourly: array, algorithm: string }>}
   */
  static async getAlgorithmDetails(algorithm) {
    const [overall, browsers, hourly] = await Promise.all([
      this.getOverallStats(algorithm),
      this.getBrowserStats(algorithm),
      this.getHourlyStats(algorithm),
    ]);
    return { overall, browsers, hourly, algorithm };
  }
}

module.exports = AnalyticsService;
