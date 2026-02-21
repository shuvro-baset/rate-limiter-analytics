const pool = require("../config/db");

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

module.exports = {saveRequestLog};