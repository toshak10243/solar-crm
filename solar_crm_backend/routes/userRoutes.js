const express = require("express");
const router = express.Router();

const {
    createUser,
    getUsers,
    getUserById,
    getTeamMembers,
    updateUser,
    updateUserStatus,
    deleteUser,
    updateFcmToken // 👈 Imported FCM controller
} = require("../controllers/userController");

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// 🟢 Update FCM Token (Logged-in user ke liye — Admin/Manager/Sales sabhi)
// NOTE: Isko /:id se upar rakha hai taaki route clash na ho
router.put(
    "/fcm-token",
    verifyToken,
    updateFcmToken
);

// Create User
router.post(
    "/",
    verifyToken,
    authorizeRoles(1),
    createUser
);

// Get All Users
router.get(
    "/",
    verifyToken,
    authorizeRoles(1),
    getUsers
);

// 🔵 Get Manager's Team Members (ROLE_MANAGER = 2)
router.get(
    "/team",
    verifyToken,
    authorizeRoles(2),
    getTeamMembers
);

// Get User By ID
router.get(
    "/:id",
    verifyToken,
    authorizeRoles(1),
    getUserById
);

// Update User
router.put(
    "/:id",
    verifyToken,
    authorizeRoles(1),
    updateUser
);

// Change User Status (Active/Inactive)
router.patch(
    "/status/:id",
    verifyToken,
    authorizeRoles(1),
    updateUserStatus
);

// Soft Delete User
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles(1),
    deleteUser
);

module.exports = router;