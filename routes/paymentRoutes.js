import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  makePayment,
  getPaymentPage,
} from "../controllers/paymentController.js";

const router = express.Router();

// Get payment page
router.get("/", getPaymentPage);

// Process payment
router.post("/:requestId", authMiddleware, makePayment);

export default router;
