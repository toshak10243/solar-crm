import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading } = useAuth();

  // 1. Context re-hydration wait
  if (loading) {
    return null;
  }

  // 2. Unauthenticated -> Login Redirect
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // 3. Open access routes
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }

  // 4. Role Normalize & Match
  const userRole = (user?.role_name || user?.role || "").toLowerCase().trim();
  const isAllowed = allowedRoles.some((role) => {
    const target = role.toLowerCase().trim();
    return userRole.includes(target) || target.includes(userRole);
  });

  if (isAllowed) {
    return <Outlet />;
  }

  // 5. Smart Silent Redirection (Zero Error Screens)
  if (userRole.includes("manager")) {
    return <Navigate to="/manager/dashboard" replace />;
  }
  if (userRole.includes("sales")) {
    return <Navigate to="/sales/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default PrivateRoute;