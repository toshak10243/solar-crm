const bcrypt = require("bcrypt");

const {

    getMyProfile,
    updateMyProfile,
    changePassword,
    updateProfilePhoto

} = require("../models/profileModel");

const {

    checkUsernameExistsForUpdate,
    checkEmailExistsForUpdate,
    checkPhoneExistsForUpdate

} = require("../models/userModel");

// ======================================
// Get My Profile
// ======================================

const getMyProfileController = async (req, res) => {

    try {

        const profile = await getMyProfile(req.user.id);

        if (profile.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Profile not found."

            });

        }

        return res.status(200).json({

            success: true,
            message: "Profile fetched successfully.",
            data: profile[0]

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
// Update My Profile
// ======================================

const updateMyProfileController = async (req, res) => {

    try {

        const {

            full_name,
            username,
            email,
            phone

        } = req.body;

        if (

            !full_name ||
            !username ||
            !email ||
            !phone

        ) {

            return res.status(400).json({

                success: false,
                message: "All fields are required."

            });

        }

        if ((await checkUsernameExistsForUpdate(username, req.user.id)).length > 0) {

            return res.status(400).json({

                success: false,
                message: "Username already exists."

            });

        }

        if ((await checkEmailExistsForUpdate(email, req.user.id)).length > 0) {

            return res.status(400).json({

                success: false,
                message: "Email already exists."

            });

        }

        if ((await checkPhoneExistsForUpdate(phone, req.user.id)).length > 0) {

            return res.status(400).json({

                success: false,
                message: "Phone number already exists."

            });

        }

        const result = await updateMyProfile({

            id: req.user.id,

            full_name,

            username,

            email,

            phone

        });

        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,
                message: "Profile not found."

            });

        }

        return res.status(200).json({

            success: true,
            message: "Profile updated successfully."

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
// Change Password
// ======================================

const changePasswordController = async (req, res) => {

    try {

        const {

            current_password,
            new_password,
            confirm_password

        } = req.body;

        if (

            !current_password ||
            !new_password ||
            !confirm_password

        ) {

            return res.status(400).json({

                success: false,
                message: "All fields are required."

            });

        }

        if (new_password !== confirm_password) {

            return res.status(400).json({

                success: false,
                message: "Passwords do not match."

            });

        }

        const profile = await getMyProfile(req.user.id);

        if (profile.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Profile not found."

            });

        }

        const isMatch = await bcrypt.compare(

            current_password,
            profile[0].password

        );

        if (!isMatch) {

            return res.status(400).json({

                success: false,
                message: "Current password is incorrect."

            });

        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await changePassword(

            req.user.id,
            hashedPassword

        );

        return res.status(200).json({

            success: true,
            message: "Password changed successfully."

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
// Update Profile Photo
// ======================================

const updateProfilePhotoController = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,
                message: "Profile image is required."

            });

        }

        const result = await updateProfilePhoto(

            req.user.id,
            req.file.filename

        );

        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,
                message: "Profile not found."

            });

        }

        return res.status(200).json({

            success: true,
            message: "Profile photo updated successfully.",
            profile_image: req.file.filename

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

    getMyProfile: getMyProfileController,

    updateMyProfile: updateMyProfileController,

    changePassword: changePasswordController,

    updateProfilePhoto: updateProfilePhotoController

};