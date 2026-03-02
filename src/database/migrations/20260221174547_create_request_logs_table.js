/**
 * Creates the request_logs table used by the analytics middleware and dashboard.
 * Columns: id, request_id, ip_address, browser_name, os, route, method, algorithm_type,
 * status_code, response_time_ms, user_agent, created_at. Indexes on request_id, ip_address,
 * browser_name, algorithm_type, created_at for fast aggregations.
 */
exports.up = function (knex) {
  return knex.schema.createTable("request_logs", (table) => {
    table.bigIncrements("id").primary();
    table.string("request_id", 100).index();

    table.string("ip_address", 100).notNullable().index();
    table.string("browser_name", 100).index();
    table.string("os", 100);

    table.string("route", 200).notNullable();
    table.string("method", 10).notNullable();

    table.string("algorithm_type", 50).index();

    table.integer("status_code").notNullable();
    table.integer("response_time_ms");

    table.text("user_agent");

    table.timestamp("created_at")
         .defaultTo(knex.fn.now())
         .index();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("request_logs");
};