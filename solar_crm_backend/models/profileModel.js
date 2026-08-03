const { db } = require("../config/db");

// ======================================
// Get My Profile
// ======================================

const getMyProfile = async (userId) => {
    const [rows] = await db.query(
        `SELECT
            u.id,
            u.role_id,
            r.role_name,
            u.manager_id,
            u.full_name,
            u.username,
            u.email,
            u.phone,
            u.password,
            u.profile_image,
            u.status,
            u.last_login,
            u.created_at,
            u.updated_at
        FROM users u
        INNER JOIN roles r
        ON r.id = u.role_id
        WHERE
            u.id = ?
            AND u.is_deleted = 0
        LIMIT 1`,
        [userId]
    );

    return rows;
};

// ======================================
// Update My Profile
// ======================================

const updateMyProfile = async (data) => {
    const {
        id,
        full_name,
        username,
        email,
        phone
    } = data;

    const [result] = await db.query(
        `UPDATE users
        SET
            full_name = ?,
            username = ?,
            email = ?,
            phone = ?
        WHERE
            id = ?
            AND is_deleted = 0`,
        [
            full_name,
            username,
            email,
            phone,
            id
        ]
    );

    return result;
};

// ======================================
// Change Password
// ======================================

const changePassword = async (userId, hashedPassword) => {
    const [result] = await db.query(
        `UPDATE users
        SET password = ?
        WHERE
            id = ?
            AND is_deleted = 0`,
        [
            hashedPassword,
            userId
        ]
    );

    return result;
};

// ======================================
// Update Profile Photo
// ======================================

const updateProfilePhoto = async (userId, profileImage) => {
    const [result] = await db.query(
        `UPDATE users
        SET profile_image = ?
        WHERE
            id = ?
            AND is_deleted = 0`,
        [
            profileImage,
            userId
        ]
    );

    return result;
};

module.exports = {
    getMyProfile,
    updateMyProfile,
    changePassword,
    updateProfilePhoto
};