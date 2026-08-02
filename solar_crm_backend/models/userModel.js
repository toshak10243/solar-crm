const { db } = require("../config/db");

// ===============================
// Internal Helper: Build WHERE Clause
// ===============================
const buildUserQueryFilters = (search, role, status) => {
    let whereClause = "WHERE u.is_deleted = 0";
    const values = [];

    if (search) {
        whereClause += ` AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
        values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
        whereClause += " AND u.role_id = ?";
        values.push(role);
    }

    if (status) {
        whereClause += " AND u.status = ?";
        values.push(status);
    }

    return { whereClause, values };
};

// ===============================
// Check Username Exists
// ===============================
const checkUsernameExists = async (username) => {
    const [rows] = await db.query(
        `SELECT id FROM users WHERE username = ? AND is_deleted = 0 LIMIT 1`,
        [username]
    );
    return rows;
};

// ===============================
// Check Email Exists
// ===============================
const checkEmailExists = async (email) => {
    const [rows] = await db.query(
        `SELECT id FROM users WHERE email = ? AND is_deleted = 0 LIMIT 1`,
        [email]
    );
    return rows;
};

// ===============================
// Check Phone Exists
// ===============================
const checkPhoneExists = async (phone) => {
    const [rows] = await db.query(
        `SELECT id FROM users WHERE phone = ? AND is_deleted = 0 LIMIT 1`,
        [phone]
    );
    return rows;
};

// ===============================
// Create User
// ===============================
const createUser = async (data) => {
    const { role_id, manager_id, full_name, username, email, phone, password, created_by } = data;
    
    const [result] = await db.query(
        `INSERT INTO users (role_id, manager_id, full_name, username, email, phone, password, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [role_id, manager_id, full_name, username, email, phone, password, created_by]
    );
    return result;
};

// ===============================
// Get All Users (With Pagination)
// ===============================
const getAllUsers = async (offset, limit, search, role, status) => {
    const { whereClause, values } = buildUserQueryFilters(search, role, status);

    const query = `
        SELECT 
            u.id, u.full_name, u.username, u.email, u.phone, 
            u.status, u.last_login, u.created_at, 
            r.role_name,
            m.full_name AS manager_name
        FROM users u
        LEFT JOIN users m ON u.manager_id = m.id
        INNER JOIN roles r ON u.role_id = r.id
        ${whereClause}
        ORDER BY u.id DESC
        LIMIT ?, ?
    `;

    const [rows] = await db.query(query, [...values, Number(offset), Number(limit)]);
    return rows;
};

// ===============================
// Get Total Users Count (For Pagination)
// ===============================
const getTotalUsersCount = async (search, role, status) => {
    const { whereClause, values } = buildUserQueryFilters(search, role, status);

    const query = `
        SELECT COUNT(*) AS totalRecords
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        ${whereClause}
    `;

    const [rows] = await db.query(query, values);
    return rows[0].totalRecords;
};

// ===============================
// Get User By ID
// ===============================
const getUserById = async (id) => {

    const [rows] = await db.query(
        `SELECT

            u.id,
            u.role_id,
            u.manager_id,
            u.full_name,
            u.username,
            u.email,
            u.phone,
            u.profile_image,
            u.status,
            u.last_login,
            u.created_at,
            r.role_name,
            m.full_name AS manager_name

        FROM users u

        LEFT JOIN users m
        ON u.manager_id = m.id

        INNER JOIN roles r
        ON u.role_id = r.id

        WHERE
            u.id = ?
            AND u.is_deleted = 0

        LIMIT 1`,
        [id]
    );

    return rows;
};

// ===============================
// Check Username Exists Except Current User
// ===============================
const checkUsernameExistsForUpdate = async (username, id) => {

    const [rows] = await db.query(
        `SELECT id
         FROM users
         WHERE username = ?
         AND id != ?
         AND is_deleted = 0
         LIMIT 1`,
        [username, id]
    );

    return rows;
};

// ===============================
// Check Email Exists Except Current User
// ===============================
const checkEmailExistsForUpdate = async (email, id) => {

    const [rows] = await db.query(
        `SELECT id
         FROM users
         WHERE email = ?
         AND id != ?
         AND is_deleted = 0
         LIMIT 1`,
        [email, id]
    );

    return rows;
};

// ===============================
// Check Phone Exists Except Current User
// ===============================
const checkPhoneExistsForUpdate = async (phone, id) => {

    const [rows] = await db.query(
        `SELECT id
         FROM users
         WHERE phone = ?
         AND id != ?
         AND is_deleted = 0
         LIMIT 1`,
        [phone, id]
    );

    return rows;
};

// ===============================
// Update User
// ===============================
const updateUser = async (data) => {

    const {
        id,
        role_id,
        manager_id,
        full_name,
        username,
        email,
        phone
    } = data;

    const [result] = await db.query(

        `UPDATE users
        SET
            role_id = ?,
            manager_id = ?,
            full_name = ?,
            username = ?,
            email = ?,
            phone = ?
        WHERE 
            id = ? 
            AND is_deleted = 0`,

        [
            role_id,
            manager_id,
            full_name,
            username,
            email,
            phone,
            id
        ]

    );

    return result;

};

// ===============================
// Update User Status
// ===============================
const updateUserStatus = async (id, status) => {

    const [result] = await db.query(
        `UPDATE users
        SET status = ?
        WHERE id = ?
        AND is_deleted = 0`,
        [status, id]
    );

    return result;
};

// ===============================
// Soft Delete User
// ===============================
const softDeleteUser = async (id) => {

    const [result] = await db.query(
        `UPDATE users
        SET is_deleted = 1
        WHERE id = ?`,
        [id]
    );

    return result;
};

module.exports = {
    checkUsernameExists,
    checkEmailExists,
    checkPhoneExists,
    createUser,
    getAllUsers,
    getTotalUsersCount,
    getUserById,
    checkUsernameExistsForUpdate,
    checkEmailExistsForUpdate,
    checkPhoneExistsForUpdate,
    updateUser,
    updateUserStatus,
    softDeleteUser
};