// routes/reportsRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getRequestsPerDepartment,
  getPaymentSummary,
} from "../controllers/reportsController.js";

const router = express.Router();

// Only admin can access
router.get("/department-requests", authMiddleware, getRequestsPerDepartment);
router.get("/payment-summary", authMiddleware, getPaymentSummary);

export default router;
