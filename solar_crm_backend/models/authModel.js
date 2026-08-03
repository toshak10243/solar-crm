const { db } = require("../config/db");

// ===============================
// Get User By Login
// ===============================
const getUserByLogin = async (login) => {

    const [rows] = await db.query(
        `SELECT
            u.id,
            u.role_id,
            u.manager_id,
            u.full_name,
            u.username,
            u.email,
            u.phone,
            u.password,
            u.profile_image,
            u.status,
            u.last_login,
            r.role_name

        FROM users u

        INNER JOIN roles r
        ON r.id = u.role_id

        WHERE
        (
            u.username = ?
            OR u.email = ?
            OR u.phone = ?
        )

        AND u.is_deleted = 0

        LIMIT 1`,
        [login, login, login]
    );

    return rows;
};

// ===============================
// Update Last Login
// ===============================
const updateLastLogin = async (userId) => {

    await db.query(
        `UPDATE users
        SET last_login = NOW()
        WHERE id = ?`,
        [userId]
    );

};

const getUserForForgotPassword = async (login) => {

    const [rows] = await db.query(

        `SELECT
            id,
            full_name,
            email
        FROM users
        WHERE
        (
            username = ?
            OR email = ?
            OR phone = ?
        )
        AND status='Active'
        AND is_deleted=0
        LIMIT 1`,

        [login, login, login]

    );

    return rows;

};

const deleteOldOTP = async (userId) => {

    await db.query(

        `DELETE FROM password_reset_otps
        WHERE user_id=?`,

        [userId]

    );

};

const saveResetOTP = async (userId, otp, expiresAt) => {

    await db.query(

        `INSERT INTO password_reset_otps
        (
            user_id,
            otp,
            expires_at
        )
        VALUES
        (
            ?,?,?
        )`,

        [
            userId,
            otp,
            expiresAt
        ]

    );

};

const getValidOTP = async (userId) => {

    const [rows] = await db.query(

        `SELECT *

        FROM password_reset_otps

        WHERE

        user_id=?

        AND is_verified=0

        AND expires_at>NOW()

        LIMIT 1`,

        [userId]

    );

    return rows;

};

const verifyOTP = async (id) => {

    await db.query(

        `UPDATE password_reset_otps

        SET is_verified=1

        WHERE id=?`,

        [id]

    );

};

const updatePassword = async (userId, password) => {

    await db.query(

        `UPDATE users

        SET password=?

        WHERE id=?`,

        [
            password,
            userId
        ]

    );

};

module.exports = {

    getUserByLogin,
    updateLastLogin,
    getUserForForgotPassword,
    deleteOldOTP,
    saveResetOTP,
    getValidOTP,
    verifyOTP,
    updatePassword
};