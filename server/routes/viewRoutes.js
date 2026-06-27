// server/routes/viewRoutes.js
const express = require("express");
const router = express.Router();
const viewController = require("../controllers/viewController");
const { checkAuth } = require("../middleware/authMiddleware");

// Views access (public lookup for statistics charts)
router.get("/views/:viewname", viewController.getViewByName);

// Analytics and filtering
router.get("/stats/overview", viewController.getStatsOverview);
router.get("/stats/advanced", viewController.getAdvancedStats);
router.get("/filter/complaints", viewController.filterComplaints);
router.get("/notifications", checkAuth, viewController.getNotificationLogs);

module.exports = router;
