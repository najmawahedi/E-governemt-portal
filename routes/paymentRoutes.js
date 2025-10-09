import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  makePayment,
  getPaymentPage,
} from "../controllers/paymentController.js";

const router = express.Router();


router.get("/", getPaymentPage);

router.post("/:requestId", authMiddleware, makePayment);


router.get("/success", authMiddleware, (req, res) => {
  const { request_id, payment_id } = req.query;
  
  res.render("citizen/payment-success", {
    title: "Payment Successful",
    user: req.user,
    request_id: request_id,
    payment_id: payment_id
  });
});
export default router;
