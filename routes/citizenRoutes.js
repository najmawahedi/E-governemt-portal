import express from "express";
import {
  dashboardPage,
  applyServicePage,
  submitServiceRequest,
  trackRequests,
  notificationsPage,
} from "../controllers/citizenController.js";
import multer from "multer";
import path from "path";
import pool from "../config/db.js"; 

const router = express.Router();

// Setup multer for document upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Dashboard home
router.get("/dashboard", dashboardPage);

// Apply for a service
router.get("/apply", applyServicePage);
router.post("/apply", upload.array("documents"), submitServiceRequest);

// Track your requests
router.get("/track", trackRequests);

// Notifications
// In citizenRoutes.js - update the notifications route:
router.get("/notifications", async (req, res) => {
  try {
    const { citizen_id, name } = req.query;

    if (!citizen_id || !name) {
      return res.status(400).send("Missing citizen information. Please login again.");
    }

    // Fetch notifications from database - use user_id column
    const notifications = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",  // ✅ Use user_id
      [citizen_id]
    );

    res.render("citizen/notifications", {
      notifications: notifications.rows,
      user: { id: citizen_id, name },
    });
  } catch (err) {
    console.error("❌ Error in notifications page:", err.message);
    res.status(500).send("Server error");
  }
});

export default router;
