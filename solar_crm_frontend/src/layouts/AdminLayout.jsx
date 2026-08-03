import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import Sidebar from "../components/Admin/Sidebar";
import Navbar from "../components/Admin/Navbar";

const SIDEBAR_WIDTH = 280;
const NAVBAR_HEIGHT = 72;

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F7FA" }}>
      {/* Fixed Navbar */}
      <Navbar
        handleDrawerToggle={handleDrawerToggle}
        sidebarWidth={SIDEBAR_WIDTH}
        navbarHeight={NAVBAR_HEIGHT}
      />

      {/* Fixed Sidebar (Permanent Desktop / Temporary Mobile Drawer) */}
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        sidebarWidth={SIDEBAR_WIDTH}
      />

      {/* Main Content Area (Only Content Scrolls) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F5F7FA",
        }}
      >
        {/* Toolbar Spacer to prevent content from hiding under fixed Navbar */}
        <Toolbar sx={{ minHeight: `${NAVBAR_HEIGHT}px !important` }} />

        {/* Scrollable Page Content Container */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2.5, sm: 3.5, md: 4 },
            overflowY: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;