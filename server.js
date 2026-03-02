/**
 * @file server.js
 * @description Application entry point. Loads environment variables, mounts the Express app,
 *              and starts the HTTP server after verifying database connectivity.
 *
 * Why this approach:
 * - Dotenv is loaded first so PORT and DB config are available before requiring app and pool.
 * - A simple "SELECT 1" query on startup confirms PostgreSQL is reachable before accepting traffic.
 * - Default port 3000 avoids conflicts with macOS AirPlay (which often uses 5000).
 *
 * @module server
 */

require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

/** @type {number} HTTP port; from env or 3000 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log(`Server running on port ${PORT}`);
  } catch (err) {
    console.error("Database connection failed", err);
  }
});
