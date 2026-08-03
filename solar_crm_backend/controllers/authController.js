const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const {
    getUserByLogin,
    updateLastLogin,
    getUserForForgotPassword,
    deleteOldOTP,
    saveResetOTP,
    getValidOTP,
    verifyOTP,
    updatePassword
} = require("../models/authModel");

// ===============================
// Mail Transporter
// ===============================
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// ===============================
// Login Controller
// ===============================
const login = async (req, res) => {

    try {

        const { login, password } = req.body;

        // Validation

        if (!login || !password) {

            return res.status(400).json({
                success: false,
                message: "Login ID and Password are required."
            });

        }

        // Find User

        const users = await getUserByLogin(login);

        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Account not found."
            });

        }

        const user = users[0];

        // Status

        if (user.status !== "Active") {

            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact the administrator."
            });

        }

        // Password

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid login credentials."
            });

        }

        // JWT

        const token = jwt.sign(
            {
                id: user.id,
                role_id: user.role_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

        // Update Last Login

        await updateLastLogin(user.id);

        delete user.password;

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user
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
// Forgot Password
// ======================================

const forgotPassword = async (req, res) => {

    try {

        const { login } = req.body;

        if (!login) {

            return res.status(400).json({
                success: false,
                message: "Username, Email or Phone is required."
            });

        }

        const users = await getUserForForgotPassword(login);

        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Account not found."
            });

        }

        const user = users[0];

        const otp = Math.floor(
            1000 + Math.random() * 9000
        ).toString();

        const hashedOTP = await bcrypt.hash(otp, 10);

        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await deleteOldOTP(user.id);

        await saveResetOTP(
            user.id,
            hashedOTP,
            expiresAt
        );

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: user.email,
            subject: "Solar CRM Password Reset OTP",
            html: `
                <h2>Hello ${user.full_name},</h2>
                <p>Your Password Reset OTP is</p>
                <h1>${otp}</h1>
                <p>This OTP will expire in 10 minutes.</p>
                <br>
                <p>Solar CRM</p>
            `
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });

    }

};

// ======================================
// Reset Password
// ======================================

const resetPassword = async (req, res) => {

    try {

        const {
            login,
            otp,
            password,
            confirm_password
        } = req.body;

        if (
            !login ||
            !otp ||
            !password ||
            !confirm_password
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });

        }

        if (password !== confirm_password) {

            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });

        }

        const users = await getUserForForgotPassword(login);

        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Account not found."
            });

        }

        const user = users[0];

        const otpRows = await getValidOTP(user.id);

        if (otpRows.length === 0) {

            return res.status(400).json({
                success: false,
                message: "OTP expired."
            });

        }

        const otpData = otpRows[0];

        const isMatch = await bcrypt.compare(
            otp,
            otpData.otp
        );

        if (!isMatch) {

            return res.status(400).json({
                success: false,
                message: "Invalid OTP."
            });

        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        await updatePassword(
            user.id,
            hashedPassword
        );

        await verifyOTP(
            otpData.id
        );

        return res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });

    }

};

module.exports = {
    login,
    forgotPassword,
    resetPassword
};