// server/routes/employeeRoutes.js
const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const { checkAuth, restrictTo } = require("../middleware/authMiddleware");

// Public routes (though registration has role-based checks if active session exists)
router.post("/register", employeeController.register);
router.post("/login", employeeController.login);
router.post("/logout", employeeController.logout);

// Protected routes
router.get("/me", checkAuth, employeeController.getMe);
router.get("/", checkAuth, employeeController.listEmployees);
router.put("/:id/role", checkAuth, restrictTo("Head", "Admin"), employeeController.updateRole);
router.delete("/:id", checkAuth, employeeController.deleteEmployee);

module.exports = router;
