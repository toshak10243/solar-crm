const express = require("express");

const router = express.Router();

const {
    login,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

// ==============================
// Authentication Routes
// ==============================

// Login
router.post("/login", login);

// Forgot Password (Send OTP)
router.post("/forgot-password", forgotPassword);

// Reset Password (Verify OTP + Update Password)
router.post("/reset-password", resetPassword);

module.exports = router;