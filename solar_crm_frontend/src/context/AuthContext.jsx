import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getToken,
  getCurrentUser,
  setToken,
  setUser as setStoredUser,
  logout as clearStorage,
} from "../utils/auth";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  // App init & sync on mount
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getCurrentUser();

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUserState(storedUser);
    } else {
      clearStorage();
      setTokenState(null);
      setUserState(null);
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setToken(authToken);
    setStoredUser(userData);
    setTokenState(authToken);
    setUserState(userData);
  };

  const logout = () => {
    clearStorage();
    setTokenState(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};