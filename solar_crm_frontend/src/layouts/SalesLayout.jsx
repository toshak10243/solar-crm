import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import SalesSidebar from "./SalesSidebar";
import SalesNavbar from "./SalesNavbar";

const DRAWER_WIDTH = 260;

const SalesLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      {/* Top Fixed Header Navbar */}
      <SalesNavbar handleDrawerToggle={handleDrawerToggle} />

      {/* Left Sidebar Drawer */}
      <SalesSidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Main Page Content Container */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
        }}
      >
        <Toolbar /> {/* Top Spacing for Fixed Navbar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default SalesLayout;