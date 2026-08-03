const {

    getSettings,
    updateSettings,
    updateCompanyLogo

} = require("../models/settingsModel");

// ======================================
// Get Settings
// ======================================

const getSettingsController = async (req, res) => {

    try {

        const settings = await getSettings();

        return res.status(200).json({

            success: true,
            message: "Settings fetched successfully.",
            data: settings[0]

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,
            message: "Internal Server Error."

        });

    }

};

// ======================================
// Update Settings
// ======================================

const updateSettingsController = async (req, res) => {

    try {

        await updateSettings(req.body);

        return res.status(200).json({

            success: true,
            message: "Settings updated successfully."

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,
            message: "Internal Server Error."

        });

    }

};

// ======================================
// Update Company Logo
// ======================================

const updateCompanyLogoController = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,
                message: "Please upload company logo."

            });

        }

        await updateCompanyLogo(req.file.filename);

        return res.status(200).json({

            success: true,
            message: "Company logo updated successfully.",
            logo: req.file.filename

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,
            message: "Internal Server Error."

        });

    }

};

module.exports = {

    getSettings: getSettingsController,
    updateSettings: updateSettingsController,
    updateCompanyLogo: updateCompanyLogoController

};