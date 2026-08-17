const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createLead, getLeads, getLeadById, getTeamFollowupsList, updateLead, updateLeadStatus,
  assignLead, bulkReassign, bulkImport, addFollowup, getFollowups, getActivityLogs, deleteLead,
} = require("../controllers/leadController");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

router.get("/", verifyToken, getLeads);
router.post("/", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), createLead);

// ⚠️ /:id se UPAR rakhna zaroori hai, warna "bulk-reassign" ko :id samajh lega
router.patch("/bulk-reassign", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), bulkReassign);

// ⚠️ /:id se UPAR rakhna hai
router.post("/bulk-import", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), bulkImport);

// ⚠️ /:id se UPAR rakhna hai
router.get("/team/followups", verifyToken, authorizeRoles(ROLE_MANAGER), getTeamFollowupsList);

router.get("/:id", verifyToken, getLeadById);
router.put("/:id", verifyToken, updateLead);
router.patch("/:id/status", verifyToken, updateLeadStatus);
router.post("/:id/assign", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), assignLead);
router.post("/:id/followups", verifyToken, addFollowup);
router.get("/:id/followups", verifyToken, getFollowups);
router.get("/:id/logs", verifyToken, getActivityLogs);
router.delete("/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN), deleteLead);

module.exports = router;