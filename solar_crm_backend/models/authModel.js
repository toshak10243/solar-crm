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

module.exports = {
    getUserByLogin,
    updateLastLogin
};