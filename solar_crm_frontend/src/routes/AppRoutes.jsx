import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";

// Layout & Protection
import PrivateRoute from "./PrivateRoute";
import AdminLayout from "../layouts/AdminLayout";

// Dashboard & CRM Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Users from "../pages/Users/Users";
import Leads from "../pages/Leads/Leads";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import Profile from "../pages/Profile/Profile";

import { isLoggedIn } from "../utils/auth";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Layout Routes (Sidebar & Navbar automatically shared) */}
        <Route
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Fallback Catch-all Route */}
        <Route
          path="*"
          element={
            isLoggedIn() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;