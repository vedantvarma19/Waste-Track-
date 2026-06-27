// server/routes/wasteRoutes.js
const express = require("express");
const router = express.Router();
const wasteController = require("../controllers/wasteController");
const { checkAuth } = require("../middleware/authMiddleware");

router.post("/waste", checkAuth, wasteController.recordWaste);

module.exports = router;
