const pool = require("../config/db");

class AnalyticsService {
  static _algorithmFilter(algorithm) {
    return algorithm ? "WHERE algorithm_type = $1" : "";
  }

  static _params(algorithm) {
    return algorithm ? [algorithm] : [];
  }

  // Overall request count (optional algorithm filter)
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

  // Browser wise count (optional algorithm filter)
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

  // Algorithm wise count
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

  // Requests per hour (optional algorithm filter)
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

  // Full algorithm-specific analytics (overall, browsers, hourly)
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