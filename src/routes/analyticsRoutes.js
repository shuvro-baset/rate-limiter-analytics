const express = require("express");
const router = express.Router();

const AnalyticsController = require("../controllers/analyticsController");

router.get("/ping", (req, res) => res.json({ ok: true }));
router.get("/overall", AnalyticsController.overall);
router.get("/browsers", AnalyticsController.browsers);
router.get("/algorithms", AnalyticsController.algorithms);
router.get("/hourly", AnalyticsController.hourly);
router.get("/algorithm/:name", AnalyticsController.algorithmDetails);

module.exports = router;