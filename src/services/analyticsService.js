const pool = require("../config/db");

class AnalyticsService {
  // Overall request count
  static async getOverallStats() {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM request_logs
    `);

    return rows[0];
  }

  // Browser wise count
  static async getBrowserStats() {
    const { rows } = await pool.query(`
      SELECT 
        browser,
        COUNT(*) as total
      FROM request_logs
      GROUP BY browser
      ORDER BY total DESC
    `);

    return rows;
  }

  // Algorithm wise count
  static async getAlgorithmStats() {
    const { rows } = await pool.query(`
      SELECT 
        algorithm_type,
        COUNT(*) as total
      FROM request_logs
      GROUP BY algorithm_type
      ORDER BY total DESC
    `);

    return rows;
  }

  // Requests per hour (for charts)
  static async getHourlyStats() {
    const { rows } = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as total
      FROM request_logs
      GROUP BY hour
      ORDER BY hour ASC
    `);

    return rows;
  }

  // Filter by algorithm
  static async getAlgorithmDetails(algorithm) {
    const { rows } = await pool.query(
      `
      SELECT 
        browser_name,
        COUNT(*) as total
      FROM request_logs
      WHERE algorithm_type = $1
      GROUP BY browser_name
      ORDER BY total DESC
    `,
      [algorithm]
    );

    return rows;
  }
}

module.exports = AnalyticsService;