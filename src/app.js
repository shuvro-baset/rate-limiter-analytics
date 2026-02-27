const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

const requestId = require("./middlewares/requestId");
const loggerMiddleware = require("./middlewares/loggerMiddleware");
const globalRateLimiter = require("./middlewares/globalRateLimiter");
const analyticsMiddleware = require("./middlewares/analyticsMiddleware");
const errorHandler = require("./middlewares/errorHandler");

const app = express(); // ✅ IMPORTANT

// ------------------
// Core Middlewares
// ------------------
app.use(helmet());
app.use(cors());
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// ------------------
// Custom Middlewares
// ------------------
app.use(requestId);
app.use(loggerMiddleware);
app.use(globalRateLimiter);
app.use(analyticsMiddleware("global"));

// ------------------
// Routes
// ------------------
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        request_id: req.requestId,
    });
});

const limiterRoutes = require("./routes/limiterRoutes");

const analyticsRoutes = require("./routes/analyticsRoutes");

app.use("/api", limiterRoutes);

app.use("/analytics", analyticsRoutes);
// ------------------
// Error Handler
// ------------------
// app.use(errorHandler);

module.exports = app;