const express = require("express");
const router = express.Router();

const {
  getManagerDashboardStats,
  getSalesDashboardStats,
  getAdminDashboardStats,
} = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const ROLE_SUPER_ADMIN = 1;
const ROLE_SALES = 3;

// Manager Dashboard Endpoint (ROLE_MANAGER = 2)
router.get(
  "/manager",
  verifyToken,
  authorizeRoles(2), // Role ID 2 = Manager
  getManagerDashboardStats
);

// Sales Rep Dashboard Endpoint (ROLE_SALES = 3)
router.get(
  "/sales",
  verifyToken,
  authorizeRoles(ROLE_SALES),
  getSalesDashboardStats
);

// Admin Dashboard Endpoint (ROLE_SUPER_ADMIN = 1)
router.get(
  "/admin",
  verifyToken,
  authorizeRoles(ROLE_SUPER_ADMIN),
  getAdminDashboardStats
);

module.exports = router;