/**
 * @file knexfile.js
 * @description Knex configuration for migrations. Used by CLI (knex migrate:latest, rollback) and
 *              by the app when running migrations (e.g. in Docker CMD). Loads dotenv so DB_* and
 *              DATABASE_URL are available.
 *
 * Environments:
 * - development: connection from DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
 * - production: connection from DATABASE_URL if set, otherwise same object as development (for Docker).
 *
 * Migrations:
 * - directory: ./src/database/migrations (create table, seed dummy data).
 * - tableName: knex_migrations (Knex's migration tracking table).
 *
 * @module knexfile
 */

require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: "./src/database/migrations",
      tableName: "knex_migrations",
    },
  },

  production: {
    client: "pg",
    connection:
      process.env.DATABASE_URL ||
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
    migrations: {
      directory: "./src/database/migrations",
      tableName: "knex_migrations",
    },
  },
};
