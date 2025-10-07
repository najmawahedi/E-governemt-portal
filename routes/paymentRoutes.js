import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  makePayment,
  getPaymentPage,
} from "../controllers/paymentController.js";

const router = express.Router();

// Get payment page (no auth required - uses query params)
router.get("/", getPaymentPage);

// Process payment (with auth)
router.post("/:requestId", authMiddleware, makePayment);

// Add payment success page route
router.get("/success", (req, res) => {
  res.render("citizen/payment-success", {
    title: "Payment Successful",
    user: req.user,
  });
});

export default router;
