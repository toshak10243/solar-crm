const express = require("express");

const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");

const {
    uploadCompanyLogo,
    processCompanyLogo
} = require("../middleware/uploadMiddleware");

const {

    getSettings,
    updateSettings,
    updateCompanyLogo

} = require("../controllers/settingsController");

// ======================================
// Get Settings
// ======================================

router.get(

    "/",

    verifyToken,

    getSettings

);

// ======================================
// Update Settings
// ======================================

router.put(

    "/",

    verifyToken,

    updateSettings

);

// ======================================
// Update Company Logo
// ======================================

router.put(
    "/logo",
    verifyToken,
    uploadCompanyLogo.single("company_logo"),
    processCompanyLogo,
    updateCompanyLogo
);

module.exports = router;