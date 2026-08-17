import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  ListSubheader,
} from "@mui/material";

// Material UI Icons
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

// Logo
import logo from "../assets/images/logo.png";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

// 🟢 Synced categorized navigation matching exact Sales requirements
const navigationSections = [
  {
    subheader: "OVERVIEW",
    items: [
      { title: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/sales/dashboard" },
    ],
  },
  {
    subheader: "WORKSPACE",
    items: [
      { title: "My Leads", icon: <PhoneInTalkOutlinedIcon />, path: "/sales/leads" },
    ],
  },
  {
    subheader: "ACCOUNT",
    items: [
      { title: "My Profile", icon: <PersonOutlineOutlinedIcon />, path: "/sales/profile" },
    ],
  },
];

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "S";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const SalesSidebar = ({ mobileOpen, handleDrawerToggle, sidebarWidth = 240 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const fullName = user?.full_name || user?.name || "Sales Executive";
  const roleName = user?.role_name || user?.role || "Salesperson";
  const avatarInitials = getInitials(fullName);

  const getAvatarUrl = (imgPath) => {
    if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") return null;
    if (imgPath.startsWith("http")) return imgPath;

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

  const handleConfirmLogout = () => {
    if (authLogout) {
      authLogout();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }
    setLogoutDialogOpen(false);
    navigate("/");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0B3A63",
        color: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* BRAND HEADER */}
      <Box
        sx={{
          p: 1.5,
          px: 1.8,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          minHeight: 64,
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Solar CRM"
          sx={{ height: 32, width: "auto", flexShrink: 0 }}
        />
        <Box sx={{ overflow: "hidden" }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#FFFFFF",
              fontSize: "0.92rem",
              letterSpacing: "0.02em",
            }}
          >
            Solar CRM
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#38BDF8",
              fontSize: "0.66rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Sales Portal
          </Typography>
        </Box>
      </Box>

      {/* NAVIGATION SECTIONS */}
      <Box
        sx={{
          flex: 1,
          py: 1,
          px: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            borderRadius: "4px",
          },
        }}
      >
        {navigationSections.map((section, idx) => (
          <List
            key={section.subheader}
            disablePadding
            subheader={
              <ListSubheader
                disableSticky
                sx={{
                  backgroundColor: "transparent",
                  color: "#64748B",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  lineHeight: "22px",
                  mt: idx > 0 ? 1 : 0.2,
                  mb: 0.2,
                  px: 1.2,
                }}
              >
                {section.subheader}
              </ListSubheader>
            }
          >
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <ListItem disablePadding key={item.title} sx={{ mb: 0.3 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (mobileOpen && handleDrawerToggle) handleDrawerToggle();
                    }}
                    sx={{
                      minHeight: 36,
                      borderRadius: "6px",
                      px: 1.2,
                      backgroundColor: isActive ? "#005BAC" : "transparent",
                      color: isActive ? "#FFFFFF" : "#CBD5E1",
                      borderLeft: isActive ? "3px solid #38BDF8" : "3px solid transparent",
                      "&:hover": {
                        backgroundColor: isActive ? "#0A6FD8" : "rgba(255, 255, 255, 0.06)",
                        color: "#FFFFFF",
                      },
                      transition: "all 0.15s ease-in-out",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 28,
                        color: isActive ? "#FFFFFF" : "#94A3B8",
                        "& .MuiSvgIcon-root": { fontSize: "1.1rem" },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      slotProps={{
                        primary: {
                          fontSize: "0.8rem",
                          fontWeight: isActive ? 600 : 500,
                          whiteSpace: "nowrap",
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        ))}
      </Box>

      {/* FOOTER: PROFILE & LOGOUT */}
      <Box sx={{ p: 1.2, borderTop: "1px solid rgba(255, 255, 255, 0.08)", flexShrink: 0 }}>
        <Box
          onClick={() => navigate("/sales/profile")}
          sx={{
            p: 0.8,
            mb: 0.6,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            borderRadius: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            cursor: "pointer",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.08)" },
            transition: "background-color 0.15s ease",
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
                width: 8,
                height: 8,
                borderRadius: "50%",
              },
            }}
          >
            <Avatar
              key={user?.id || avatarInitials}
              src={avatarSrc || undefined}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: "#005BAC",
                fontSize: "0.78rem",
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
              noWrap
              sx={{ fontWeight: 600, fontSize: "0.78rem", color: "#FFFFFF" }}
            >
              {fullName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#38BDF8", fontSize: "0.66rem", display: "block", fontWeight: 500 }}
            >
              {roleName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 0.6, borderColor: "rgba(255, 255, 255, 0.08)" }} />

        <ListItemButton
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            minHeight: 34,
            borderRadius: "6px",
            color: "#F87171",
            "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.12)" },
            px: 1.2,
          }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: "#F87171", "& .MuiSvgIcon-root": { fontSize: "1.1rem" } }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            slotProps={{
              primary: { fontSize: "0.8rem", fontWeight: 600 },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Box component="nav" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 } }}>
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

      {/* CONFIRM LOGOUT DIALOG */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "10px", p: 0.5, minWidth: 300 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0B3A63", pb: 1, fontSize: "0.98rem" }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.85rem", color: "#64748B" }}>
            Are you sure you want to end your current Sales session?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.8rem" }}
          >
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
              fontSize: "0.8rem",
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalesSidebar;