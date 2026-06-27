// server/routes/complaintRoutes.js
const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const { checkAuth, restrictTo } = require("../middleware/authMiddleware");

// Public complaint submission
router.post("/complaints", complaintController.createComplaint);

// List complaints (filters based on auth status inside controller)
router.get("/complaints", complaintController.listComplaints);

// Update status (authorized per roles inside controller)
router.put("/complaints/:id/status", checkAuth, complaintController.updateStatus);

// Assign driver/vehicle to complaint
router.put("/complaints/:id/assign", checkAuth, restrictTo("Manager", "Head", "Admin"), complaintController.assignComplaint);

module.exports = router;
