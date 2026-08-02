// ========================================
// Role Authorization
// ========================================

const authorizeRoles = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.user.role_id)) {

            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource."
            });

        }

        next();

    };

};

module.exports = {
    authorizeRoles
};