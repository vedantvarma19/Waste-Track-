// server/routes/dataRoutes.js
const express = require("express");
const router = express.Router();
const dataController = require("../controllers/dataController");
const { checkAuth } = require("../middleware/authMiddleware");

// Public lookup for forms
router.get("/departments", dataController.getDepartments);
router.get("/routes", dataController.getRoutes);
router.get("/routes/:dept_id", dataController.getRoutesByDept);

// Protected vehicle list
router.get("/vehicles", checkAuth, dataController.getVehicles);

module.exports = router;
