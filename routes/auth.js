import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// Show register page
router.get("/register", (req, res) => res.render("auth/register"));

// Handle register
router.post("/register", registerUser);

// Show login page
router.get("/login", (req, res) => {
  res.render("auth/login", {
    successMessage: req.query.success
      ? "Registration successful! Please login."
      : undefined,
  });
});

// Handle login
router.post("/login", loginUser);

export default router;
