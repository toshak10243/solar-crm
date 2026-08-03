import api from "../api/axios";

// Login
export const loginUser = (data) => {
    return api.post("/auth/login", data);
};

// Forgot Password
export const forgotPassword = (data) => {
    return api.post("/auth/forgot-password", data);
};

// Reset Password
export const resetPassword = (data) => {
    return api.post("/auth/reset-password", {
        login: data.login,
        otp: data.otp,
        password: data.newPassword,
        confirm_password: data.confirmPassword
    });
};