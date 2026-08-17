const express = require("express");
const router = express.Router();

// ======================================
// Authentication Middleware
// ======================================

const { verifyToken } = require("../middleware/authMiddleware");

// ======================================
// Upload Middleware
// ======================================

const {
    uploadProfile,
    processProfileImage
} = require("../middleware/uploadMiddleware");

// ======================================
// Profile Controller
// ======================================

const {
    getMyProfile,
    updateMyProfile,
    changePassword,
    updateProfilePhoto
} = require("../controllers/profileController");

// ======================================
// Get Logged In User Profile
// ======================================

router.get(
    "/",
    verifyToken,
    getMyProfile
);

// ======================================
// Update Profile
// ======================================

router.put(
    "/",
    verifyToken,
    updateMyProfile
);

// ======================================
// Change Password
// ======================================

router.put(
    "/change-password",
    verifyToken,
    changePassword
);

// ======================================
// Update Profile Photo
// ======================================

router.put(
    "/photo",
    verifyToken,
    uploadProfile.single("profile_image"),
    processProfileImage,
    updateProfilePhoto
);

// ======================================
// Export Router
// ======================================

module.exports = router;