const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { db } = require("../config/db");

// GET /api/notifications — apni notifications lo
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/notifications/unread-count — badge ke liye
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );
    return res.status(200).json({ success: true, count: rows[0].count });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", verifyToken, async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
      [req.user.id]
    );
    return res.status(200).json({ success: true, message: "All marked as read." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// PATCH /api/notifications/:id/read — single notification mark read
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    return res.status(200).json({ success: true, message: "Marked as read." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;