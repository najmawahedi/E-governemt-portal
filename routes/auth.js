import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// show register page
// show register page
router.get("/register", (req, res) => res.render("auth/register"));




// handle register
router.post("/register", registerUser);

// show login page
// show login page
router.get("/login", (req, res) => res.render("auth/login"));

// handle login
router.post("/login", loginUser);

export default router;
