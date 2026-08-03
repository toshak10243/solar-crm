import api from "../api/axios";

// ==============================
// Get My Profile
// ==============================
export const getProfile = () => {
    return api.get("/profile");
};

// ==============================
// Update Profile
// ==============================
export const updateProfile = (data) => {
    return api.put("/profile", data);
};

// ==============================
// Change Password
// ==============================
export const changePassword = (data) => {
    return api.put("/profile/change-password", data);
};

// ==============================
// Upload Profile Photo
// ==============================
export const uploadProfilePhoto = (formData) => {
    return api.put("/profile/photo", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};