import React from "react";
import { useNavigate } from "react-router-dom";
import { logout, getCurrentUser } from "../../utils/auth"; // path ko apne folder structure ke hisab se adjust karein
import { Box, Typography, Button, Paper } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout(); // localStorage se token & user remove ho jaayega
    navigate("/", { replace: true }); // Login page par redirect ho jaayega
  };

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 2,
          border: "1px solid #E2E8F0",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0F172A" }}>
            Dashboard
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
              Welcome back, {user.name || user.email || "User"}
            </Typography>
          )}
        </Box>

        {/* Logout Button */}
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "8px",
            px: 2.5,
            py: 1,
            borderColor: "#FECACA",
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            "&:hover": {
              backgroundColor: "#FEE2E2",
              borderColor: "#FCA5A5",
            },
          }}
        >
          Logout
        </Button>
      </Paper>
    </Box>
  );
};

export default Dashboard;