const AnalyticsService = require("../services/analyticsService");

class AnalyticsController {
  static async overall(req, res, next) {
    try {
      const data = await AnalyticsService.getOverallStats();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async browsers(req, res, next) {
    try {
      const data = await AnalyticsService.getBrowserStats();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async algorithms(req, res, next) {
    try {
      const data = await AnalyticsService.getAlgorithmStats();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async hourly(req, res, next) {
    try {
      const data = await AnalyticsService.getHourlyStats();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async algorithmDetails(req, res, next) {
    try {
      const { name } = req.params;
      const data = await AnalyticsService.getAlgorithmDetails(name);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AnalyticsController;