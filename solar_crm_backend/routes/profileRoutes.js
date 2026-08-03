const express = require("express");
const router = express.Router();

// Destructure the specific middleware function (verifyToken or authMiddleware)
const { verifyToken } = require("../middleware/authMiddleware"); 
// 👆 Note: Agar aapke middleware ka naam 'authenticate' ya 'authMiddleware' hai 
// inside the file, then use: const { authMiddleware } = require(...)

const { uploadProfile } = require("../middleware/uploadMiddleware");

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
    verifyToken, // 👈 Destructured function here
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
    updateProfilePhoto
);

module.exports = router;