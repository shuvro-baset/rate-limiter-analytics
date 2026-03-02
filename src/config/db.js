/**
 * @file db.js
 * @description PostgreSQL connection pool used by the app and Knex migrations.
 *
 * Why Pool:
 * - Node-postgres Pool manages multiple clients and reuses them, avoiding per-request connect/disconnect.
 * - Default pool size is suitable for typical API load; for high concurrency, configure pool options here.
 *
 * Environment variables (from .env):
 * - DB_HOST: PostgreSQL server host (e.g. localhost or postgres in Docker).
 * - DB_PORT: PostgreSQL port (default 5432).
 * - DB_USER: Database user.
 * - DB_PASSWORD: Database password.
 * - DB_NAME: Database name (e.g. rate_limiters_db).
 *
 * @module config/db
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
