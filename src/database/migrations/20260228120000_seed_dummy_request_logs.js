/**
 * One-time seed: insert dummy request_logs for multiple browsers and algorithms
 * when the table is empty (first install/run). Safe to run multiple times.
 *
 * Purpose: Populate the dashboard with sample data so charts and KPIs are visible
 * without generating real traffic. Rows use request_id prefix "seed-" so they can
 * be removed in down() without affecting real logs.
 *
 * Data: ALGORITHMS × BROWSERS × OS_LIST × 3 requests per combination; created_at
 * spread over recent hours for hourly chart. All algorithm_type and browser_name
 * values match the app's routes and UAParser output.
 */

const ALGORITHMS = [
  "global",
  "fixed",
  "sliding-log",
  "sliding-counter",
  "token-bucket",
  "leaky-bucket",
];

const BROWSERS = [
  "Chrome",
  "Firefox",
  "Safari",
  "Edge",
  "Opera",
];

const OS_LIST = ["Windows", "macOS", "Linux", "Android", "iOS"];

const IPs = [
  "192.168.1.10",
  "192.168.1.11",
  "10.0.0.5",
  "10.0.0.6",
  "172.16.0.1",
  "172.16.0.2",
  "203.0.113.10",
  "198.51.100.20",
];

const ROUTES = {
  global: "/health",
  fixed: "/api/fixed",
  "sliding-log": "/api/sliding-log",
  "sliding-counter": "/api/sliding-counter",
  "token-bucket": "/api/token-bucket",
  "leaky-bucket": "/api/leaky-bucket",
};

function buildDummyRows() {
  const rows = [];
  let id = 0;
  const now = new Date();

  ALGORITHMS.forEach((algorithm) => {
    BROWSERS.forEach((browser, bIdx) => {
      OS_LIST.forEach((os, oIdx) => {
        for (let i = 0; i < 3; i++) {
          const ip = IPs[(bIdx + oIdx + i) % IPs.length];
          const hourOffset = (id % 24) - 12;
          const created = new Date(now);
          created.setHours(created.getHours() - hourOffset);
          created.setMinutes(created.getMinutes() - (id % 60));

          rows.push({
            request_id: `seed-${algorithm}-${bIdx}-${oIdx}-${i}`,
            ip_address: ip,
            browser_name: browser,
            os,
            route: ROUTES[algorithm] || "/api/fixed",
            method: "GET",
            algorithm_type: algorithm,
            status_code: 200,
            response_time_ms: 10 + (id % 90),
            user_agent: `${browser}/${id}`,
            created_at: created,
          });
          id++;
        }
      });
    });
  });

  return rows;
}

exports.up = async function (knex) {
  const result = await knex("request_logs").count("* as n").first();
  const hasRows = result && parseInt(result.n, 10) > 0;
  if (hasRows) return;

  const rows = buildDummyRows();
  await knex("request_logs").insert(rows);
};

exports.down = async function (knex) {
  await knex("request_logs").where("request_id", "like", "seed-%").del();
};
