const UAParser = require("ua-parser-js");
const { saveRequestLog } = require("../services/analytics.service");

module.exports = (algorithmType = "global") => {
  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", async () => {
      try {
        const parser = new UAParser(req.headers["user-agent"]);

        await saveRequestLog({
          request_id: req.requestId,
          ip: req.ip,
          browser: parser.getBrowser().name,
          os: parser.getOS().name,
          route: req.originalUrl,
          method: req.method,
          algorithm: algorithmType,
          status: res.statusCode,
          responseTime: Date.now() - start,
          userAgent: req.headers["user-agent"],
        });
      } catch {}
    });

    next();
  };
};