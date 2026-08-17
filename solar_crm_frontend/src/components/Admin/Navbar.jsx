import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Agar aap useAuth Context use kar rahe hain

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

// Material UI Icons
import MenuIcon from "@mui/icons-material/Menu";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

// Dynamic Breadcrumbs and Page Title Mapping
const getPageMetadata = (pathname) => {
  if (pathname.startsWith("/users")) return { title: "User Management", breadcrumb: "Users" };
  if (pathname.startsWith("/leads")) return { title: "Lead Management", breadcrumb: "Leads" };
  if (pathname.startsWith("/reports")) return { title: "Reports & Analytics", breadcrumb: "Reports" };
  if (pathname.startsWith("/settings")) return { title: "System Settings", breadcrumb: "Settings" };
  if (pathname.startsWith("/profile")) return { title: "My Profile", breadcrumb: "Profile" };
  return { title: "Dashboard Overview", breadcrumb: "Dashboard" };
};

const Navbar = ({ handleDrawerToggle, sidebarWidth = 280, navbarHeight = 72 }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Try using AuthContext if available, otherwise fallback to state/localStorage
  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
  } catch (e) {
    // AuthProvider missing fallback
  }

  // Component States
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Local Storage Fallback if Auth Context is not used
  const [localUser, setLocalUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const user = authUser || localUser;

  // Sync LocalStorage only if AuthContext isn't available
  useEffect(() => {
    if (authUser) return;

    const handleStorageChange = () => {
      try {
        const updated = JSON.parse(localStorage.getItem("user") || "null");
        setLocalUser(updated);
      } catch (e) {
        console.error("Error reading updated user state", e);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [authUser]);

  // Real-time Clock updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fullName = user?.full_name || user?.name || "User";
  const roleName = user?.role_name || user?.role || "Administrator";

  // Stable Avatar URL Generator (No Date.now() to prevent blinking on clock update)
  const avatarSrc = useMemo(() => {
    const imgPath = user?.profile_image;
    if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") {
      return null;
    }

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

    return `${API_BASE_URL}/${cleanPath}`;
  }, [user?.profile_image]);

  // Dynamic Avatar Initials Generator
  const initials = fullName
    ? fullName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "U";

  const pageMeta = getPageMetadata(location.pathname);

  // Formatting Date and Time
  const dayName = currentTime.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = currentTime.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Handle Profile Navigation Confirmation
  const handleOpenProfileConfirm = () => {
    setProfileDialogOpen(false);
    navigate("/profile");
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E5E7EB",
          color: "#1E293B",
          height: `${navbarHeight}px`,
          justifyContent: "center",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.03)",
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3.5 } }}>
          {/* LEFT SECTION: Mobile Hamburger, Breadcrumbs & Dynamic Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: "none" }, color: "#0B3A63" }}
            >
              <MenuIcon />
            </IconButton>

            <Box>
              <Breadcrumbs
                separator="›"
                sx={{
                  fontSize: "0.75rem",
                  color: "#64748B",
                  mb: 0.2,
                  "& .MuiBreadcrumbs-separator": { color: "#94A3B8" },
                }}
              >
                <Link underline="hover" color="inherit" href="/dashboard">
                  Dashboard
                </Link>
                <Typography sx={{ fontSize: "0.75rem", color: "#0284C7", fontWeight: 600 }}>
                  {pageMeta.breadcrumb}
                </Typography>
              </Breadcrumbs>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1rem", sm: "1.15rem" },
                  color: "#0B3A63",
                  lineHeight: 1.1,
                }}
              >
                {pageMeta.title}
              </Typography>
            </Box>
          </Box>

          {/* CENTER SECTION: Enterprise Vertical Stack Date & Time Widget */}
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "center",
              gap: 1.5,
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              px: 2.5,
              height: "56px",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.03)",
            }}
          >
            <AccessTimeOutlinedIcon sx={{ color: "#005BAC", fontSize: "1.4rem", flexShrink: 0 }} />

            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  color: "#64748B",
                  lineHeight: 1.1,
                }}
              >
                <Box component="span" sx={{ color: "#1E293B", fontWeight: 700 }}>
                  {dayName}
                </Box>
                {" • "}
                {formattedDate}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  color: "#005BAC",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  mt: 0.2,
                }}
              >
                {formattedTime}
              </Typography>
            </Box>
          </Box>

          {/* RIGHT SECTION: Interactive Profile Area */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2.5 } }}>
            <Box
              onClick={() => setProfileDialogOpen(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                cursor: "pointer",
                p: 0.8,
                borderRadius: "10px",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <Avatar
                key={user?.id || user?.email || "avatar-user"}
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
                {initials}
              </Avatar>

              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.2, color: "#0F172A" }}
                >
                  {fullName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#0284C7", fontSize: "0.72rem", fontWeight: 600, display: "block" }}
                >
                  {roleName}
                </Typography>
              </Box>

              <KeyboardArrowRightIcon sx={{ color: "#64748B", fontSize: 20 }} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Confirmation Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "14px", p: 1, minWidth: 340 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "#0B3A63",
            pb: 1,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            fontSize: "1.1rem",
          }}
        >
          <AccountCircleOutlinedIcon sx={{ color: "#005BAC", fontSize: "1.5rem" }} />
          Open Profile
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem", color: "#64748B" }}>
            Do you want to view and manage your profile?
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setProfileDialogOpen(false)}
            sx={{ color: "#64748B", fontWeight: 600, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleOpenProfileConfirm}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#005BAC",
              "&:hover": { backgroundColor: "#0A6FD8" },
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              px: 2.5,
            }}
          >
            Open Profile
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Navbar;