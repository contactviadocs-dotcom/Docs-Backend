import express from "express";
import { signup, login, checkUsername, sendOtp, verifyOtp, resetPassword, verifyToken } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/check-username", checkUsername); // ✅ new route

// Verify token/session
router.get("/verify", verifyToken);

// 🆕 Forgot Password Routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

export default router;
