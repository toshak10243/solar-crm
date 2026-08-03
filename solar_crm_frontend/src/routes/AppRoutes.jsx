import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import Dashboard from "../pages/Dashboard/Dashboard";

import PrivateRoute from "./PrivateRoute";
import { isLoggedIn } from "../utils/auth";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route
          path="/"
          element={<Login />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Protected Route */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* 404 / Catch-all Route */}
        <Route
          path="*"
          element={
            isLoggedIn()
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/" replace />
          }
        />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;