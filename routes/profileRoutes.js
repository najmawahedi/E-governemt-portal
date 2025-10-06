import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile); // GET /profile
router.put("/", authMiddleware, updateProfile); // PUT /profile

export default router;
