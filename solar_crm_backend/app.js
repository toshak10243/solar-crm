const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

// Base Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Solar CRM API Running"
    });
});

module.exports = app;