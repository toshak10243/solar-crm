import api from "../api/axios";

// ======================================
// Get Settings
// ======================================

export const getSettings = () => {

    return api.get("/settings");

};

// ======================================
// Update Settings
// ======================================

export const updateSettings = (data) => {

    return api.put("/settings", data);

};

// ======================================
// Upload Company Logo
// ======================================

export const uploadCompanyLogo = (formData) => {

    return api.put(

        "/settings/logo",

        formData,

        {

            headers: {

                "Content-Type": "multipart/form-data"

            }

        }

    );

};