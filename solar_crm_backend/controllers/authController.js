const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    getUserByLogin,
    updateLastLogin
} = require("../models/authModel");

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

module.exports = {
    login
};