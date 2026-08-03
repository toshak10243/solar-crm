const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ======================================
// Middlewares
// ======================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================
// Static Uploads
// ======================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================================
// Routes
// ======================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

// ======================================
// API Routes
// ======================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);

// ======================================
// Base Route
// ======================================

app.get("/", (req, res) => {

    res.json({

        success: true,
        message: "Solar CRM API Running"

    });

});

// ======================================

module.exports = app;