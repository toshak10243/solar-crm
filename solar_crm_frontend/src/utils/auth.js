// ==============================
// Save Token
// ==============================
export const setToken = (token) => {
    localStorage.setItem("token", token);
};

// ==============================
// Get Token
// ==============================
export const getToken = () => {
    return localStorage.getItem("token");
};

// ==============================
// Save User
// ==============================
export const setUser = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
};

// ==============================
// Get Current User
// ==============================
export const getCurrentUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

// ==============================
// Check Login
// ==============================
export const isLoggedIn = () => {
    return !!getToken();
};

// ==============================
// Logout
// ==============================
export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};