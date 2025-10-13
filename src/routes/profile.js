import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { getProfile, updateProfile, uploadProfileImage } from "../controllers/profileController.js";

const router = express.Router();

router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, updateProfile); // text fields only
router.put("/upload", authMiddleware, upload.single("profileImage"), uploadProfileImage); // images

export default router;
