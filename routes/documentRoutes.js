import express from "express";
import {
  upload,
  uploadDocument,
  getDocuments,
} from "../controllers/documentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload single file for a request
router.post(
  "/requests/:id/documents",
  authMiddleware,
  upload.single("file"),
  uploadDocument
);

// Get all documents for a request (Officer/Admin)
router.get("/requests/:id/documents", authMiddleware, getDocuments);

export default router;
