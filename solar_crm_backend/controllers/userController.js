const bcrypt = require("bcrypt");

const {

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

} = require("../models/userModel");

// ======================================
// Create User
// ======================================
const createUserController = async (req, res) => {
    try {
        const { role_id, manager_id, full_name, username, email, phone, password } = req.body;

        if (!role_id || !full_name || !username || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (role_id == 3 && !manager_id) {
            return res.status(400).json({
                success: false,
                message: "Manager is required for Sales Person."
            });
        }

        if ((await checkUsernameExists(username)).length > 0) {
            return res.status(400).json({ success: false, message: "Username already exists." });
        }

        if ((await checkEmailExists(email)).length > 0) {
            return res.status(400).json({ success: false, message: "Email already exists." });
        }

        if ((await checkPhoneExists(phone)).length > 0) {
            return res.status(400).json({ success: false, message: "Phone number already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await createUser({
            role_id,
            manager_id: manager_id || null,
            full_name,
            username,
            email,
            phone,
            password: hashedPassword,
            created_by: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully."
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
// Get All Users
// ======================================
const getUsersController = async (req, res) => {
    try {
        // Page default 1 rakho (0 nahi)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const role = req.query.role || "";
        const status = req.query.status || "";

        // Industry standard offset calculation
        const offset = (page - 1) * limit;

        // Data aur Total Count parallel mein fetch karo (Speed优化)
        const [users, totalRecords] = await Promise.all([
            getAllUsers(offset, limit, search, role, status),
            getTotalUsersCount(search, role, status)
        ]);

        // Total Pages calculate karo
        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully.",
            data: users,
            pagination: {
                page,
                limit,
                totalRecords,
                totalPages
            }
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
// Get User By ID
// ======================================

const getUserByIdController = async (req, res) => {

    try {

        const { id } = req.params;

        const user = await getUserById(id);

        if (user.length === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }

        return res.status(200).json({

            success: true,
            message: "User fetched successfully.",
            data: user[0]

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
// Update User
// ======================================

const updateUserController = async (req, res) => {

    try {

        const { id } = req.params;

        const {

            role_id,
            manager_id,
            full_name,
            username,
            email,
            phone

        } = req.body;

        if (
            !role_id ||
            !full_name ||
            !username ||
            !email ||
            !phone
        ) {

            return res.status(400).json({
                success:false,
                message:"All fields are required."
            });

        }

        if(role_id==3 && !manager_id){

            return res.status(400).json({
                success:false,
                message:"Manager is required for Sales Person."
            });

        }

        if((await checkUsernameExistsForUpdate(username,id)).length>0){

            return res.status(400).json({
                success:false,
                message:"Username already exists."
            });

        }

        if((await checkEmailExistsForUpdate(email,id)).length>0){

            return res.status(400).json({
                success:false,
                message:"Email already exists."
            });

        }

        if((await checkPhoneExistsForUpdate(phone,id)).length>0){

            return res.status(400).json({
                success:false,
                message:"Phone number already exists."
            });

        }

        const result = await updateUser({

            id,

            role_id,

            manager_id:manager_id || null,

            full_name,

            username,

            email,

            phone

        });

        if(result.affectedRows===0){

            return res.status(404).json({
                success:false,
                message:"User not found."
            });

        }

        return res.status(200).json({

            success:true,

            message:"User updated successfully."

        });

    }

    catch(error){

        console.log(error);

        return res.status(500).json({

            success:false,

            message:"Internal Server Error."

        });

    }

};

// ======================================
// Update User Status
// ======================================

const updateUserStatusController = async (req, res) => {

    try {

        const { id } = req.params;

        const { status } = req.body;

        // Prevent Super Admin from changing own status
if (Number(req.user.id) === Number(id)) {
    return res.status(400).json({
        success: false,
        message: "You cannot change your own account status."
    });
}

        if (!status) {

            return res.status(400).json({
                success: false,
                message: "Status is required."
            });

        }

        if (status !== "Active" && status !== "Inactive") {

            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });

        }

        const result = await updateUserStatus(id, status);

        if (result.affectedRows === 0) {

            return res.status(404).json({

                success:false,
                message:"User not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "User status updated successfully."
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
// Soft Delete User
// ======================================

const deleteUserController = async (req, res) => {

    try {

        const { id } = req.params;

        // Prevent Super Admin from deleting own account
if (Number(req.user.id) === Number(id)) {
    return res.status(400).json({
        success: false,
        message: "You cannot delete your own account."
    });
}

        const result = await softDeleteUser(id);

        // User Not Found
        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }

        return res.status(200).json({

            success: true,

            message: "User deleted successfully."

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
    createUser: createUserController,
    getUsers: getUsersController,
    getUserById: getUserByIdController,
    updateUser:updateUserController,
    updateUserStatus: updateUserStatusController,
    deleteUser: deleteUserController
};