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
import fs from "fs";

const router = express.Router();

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup multer for document upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Dashboard home
router.get("/dashboard", dashboardPage);

// Apply for a service
router.get("/apply", applyServicePage);
router.post("/apply", upload.array("documents"), submitServiceRequest);

// Track your requests
router.get("/track", trackRequests);

// Notifications
router.get("/notifications", async (req, res) => {
  try {
    const { citizen_id, name } = req.query;

    if (!citizen_id || !name) {
      return res.status(400).render("error", {
        title: "Missing Information",
        message: "Please login again to view notifications.",
      });
    }

    const notifications = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [citizen_id]
    );

    res.render("citizen/notifications", {
      notifications: notifications.rows,
      user: { id: citizen_id, name },
    });
  } catch (err) {
    console.error("❌ Error in notifications route:", err.message);
    res.status(500).render("error", {
      title: "Server Error",
      message: "Failed to load notifications. Please try again.",
    });
  }
});

export default router;
