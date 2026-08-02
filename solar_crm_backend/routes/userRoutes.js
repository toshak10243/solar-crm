const express = require("express");
const router = express.Router();

const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    updateUserStatus,
    deleteUser
} = require("../controllers/userController");

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

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