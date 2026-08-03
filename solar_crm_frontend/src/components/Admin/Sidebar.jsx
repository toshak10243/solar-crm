import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../utils/auth";

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

// Material UI Icons
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import logo from "../../assets/images/logo.png";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

// Configurable Navigation Menu Items Array
const navigationMenuItems = [
  { title: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/dashboard" },
  { title: "User Management", icon: <GroupOutlinedIcon />, path: "/users" },
  { title: "Lead Management", icon: <SolarPowerOutlinedIcon />, path: "/leads" },
  { title: "Reports", icon: <AssessmentOutlinedIcon />, path: "/reports" },
  { title: "Settings", icon: <SettingsOutlinedIcon />, path: "/settings" },
];

// Helper Utility: Helper to generate 2-letter Initials from full name
const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Sidebar = ({ mobileOpen, handleDrawerToggle, sidebarWidth = 280 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Reactive User State for Instant Updates from LocalStorage
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  // Real-time Event Listener for LocalStorage Changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const updated = JSON.parse(localStorage.getItem("user") || "null");
        setUser(updated);
      } catch (e) {
        console.error("Error reading updated user state in Sidebar", e);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const fullName = user?.full_name || "User";
  const roleName = user?.role_name || "Administrator";
  const avatarInitials = getInitials(fullName);

  // Avatar Image URL Resolver
  const getAvatarUrl = (imgPath) => {
    if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") return null;

    if (imgPath.startsWith("http")) {
      return imgPath;
    }

    let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;

    if (!cleanPath.startsWith("uploads/profiles/")) {
      if (cleanPath.startsWith("uploads/")) {
        cleanPath = cleanPath.replace("uploads/", "uploads/profiles/");
      } else {
        cleanPath = `uploads/profiles/${cleanPath}`;
      }
    }

    return `${API_BASE_URL}/${cleanPath}?v=${Date.now()}`;
  };

  const avatarSrc = getAvatarUrl(user?.profile_image);

  // Handle Confirmed Logout Action
  const handleConfirmLogout = () => {
    logout();
    sessionStorage.clear();
    setLogoutDialogOpen(false);
    navigate("/");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0B3A63",
        color: "#FFFFFF",
      }}
    >
      {/* Top Section: Branding Logo & Navigation List */}
      <Box>
        {/* BRAND LOGO HEADER */}
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            alignItems: "center",
            gap: 1.8,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            minHeight: 72,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Solar CRM"
            sx={{ height: 40, width: "auto", flexShrink: 0 }}
          />
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.1, color: "#FFFFFF", fontSize: "1.05rem", letterSpacing: 0.2 }}
            >
              Solar CRM
            </Typography>
            <Typography variant="caption" sx={{ color: "#93C5FD", fontSize: "0.7rem", fontWeight: 500 }}>
              Sales Management Platform
            </Typography>
          </Box>
        </Box>

        {/* NAVIGATION ITEMS */}
        <Box
          sx={{
            py: 2.5,
            px: 1.8,
            maxHeight: "calc(100vh - 220px)",
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderRadius: "4px",
            },
          }}
        >
          <List disablePadding>
            {navigationMenuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                <ListItem disablePadding key={item.title} sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (mobileOpen) handleDrawerToggle();
                    }}
                    sx={{
                      minHeight: 48,
                      borderRadius: "8px",
                      px: 2,
                      backgroundColor: isActive ? "#005BAC" : "transparent",
                      color: isActive ? "#FFFFFF" : "#CBD5E1",
                      borderLeft: isActive ? "4px solid #38BDF8" : "4px solid transparent",
                      "&:hover": {
                        backgroundColor: isActive ? "#0A6FD8" : "rgba(255, 255, 255, 0.06)",
                        color: "#FFFFFF",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 38,
                        color: isActive ? "#FFFFFF" : "#94A3B8",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontSize: "0.88rem",
                        fontWeight: isActive ? 600 : 500,
                        whiteSpace: "nowrap",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Box>

      {/* Bottom Section: User Profile Card & Logout Button */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        {/* User Card with Dynamic Avatar & Online Indicator */}
        <Box
          onClick={() => navigate("/profile")}
          sx={{
            p: 1.2,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderRadius: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            cursor: "pointer",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.09)" },
            transition: "background-color 0.2s ease",
          }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#22C55E",
                color: "#22C55E",
                boxShadow: "0 0 0 2px #0B3A63",
                width: 10,
                height: 10,
                borderRadius: "50%",
              },
            }}
          >
            <Avatar
              key={avatarSrc || "initials"}
              src={avatarSrc || undefined}
              imgProps={{
                onError: (e) => {
                  e.target.style.display = "none";
                },
              }}
              sx={{
                width: 38,
                height: 38,
                backgroundColor: "#005BAC",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {avatarInitials}
            </Avatar>
          </Badge>

          <Box sx={{ overflow: "hidden" }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#FFFFFF", noWrap: true }}
            >
              {fullName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#38BDF8", fontSize: "0.72rem", display: "block", fontWeight: 500 }}
            >
              {roleName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5, borderColor: "rgba(255, 255, 255, 0.08)" }} />

        {/* Logout Button */}
        <ListItemButton
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            minHeight: 44,
            borderRadius: "8px",
            color: "#F87171",
            "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.12)" },
            px: 2,
          }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: "#F87171" }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Box component="nav" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: sidebarWidth,
              borderRight: "none",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Fixed Permanent Sidebar */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: sidebarWidth,
              borderRight: "none",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "12px", p: 1, minWidth: 330 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0B3A63", pb: 1 }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem", color: "#64748B" }}>
            Are you sure you want to end your current session?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: "#64748B", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#EF4444",
              "&:hover": { backgroundColor: "#DC2626" },
              fontWeight: 600,
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;