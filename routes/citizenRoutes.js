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
router.get("/notifications", notificationsPage);

export default router;
