/**
 * @file logger.js
 * @description Winston logger instance for structured application logging.
 *
 * Configuration:
 * - level: "info" — log info and above (warn, error).
 * - format: JSON for file transport so logs can be parsed by log aggregators.
 * - transports: File (logs/app.log); in non-production, Console with simple format for readability.
 *
 * Why Winston:
 * - Structured logging (JSON) and multiple transports are standard for production.
 * - Console in development avoids needing to tail a file during local development.
 *
 * @module config/logger
 */

const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;
