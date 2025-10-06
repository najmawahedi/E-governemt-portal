import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
} from "../controllers/requestsController.js";
import { makePayment } from "../controllers/paymentController.js";


const router = express.Router();

// Citizen submits new request
router.post("/", authMiddleware, createRequest);

// Get requests (role-based)
router.get("/", authMiddleware, getRequests);

// Get single request by ID
router.get("/:id", authMiddleware, getRequestById);

// Update request status (officer/admin)
router.put("/:id/status", authMiddleware, updateRequestStatus);
// Citizen makes a payment for a request
router.post("/:requestId/pay", authMiddleware, makePayment);


export default router;
