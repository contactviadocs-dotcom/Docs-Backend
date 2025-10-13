import express from "express";
import {
  getDocs,
  getDocById,
  createDoc,
  updateDoc,
  deleteDoc,
  toggleFavorite,
} from "../controllers/docsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

import multer from "multer";
import path from "path";

// ✅ Setup Multer for image uploads
// ✅ Setup Multer for image uploads with filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/docs");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});



const router = express.Router();

// ----------------- DOC ROUTES -----------------
router.get("/my-docs", authMiddleware, getDocs);
router.get("/my-docs/:id", authMiddleware, getDocById);
router.post("/my-docs", authMiddleware, createDoc);
router.put("/my-docs/:id", authMiddleware, updateDoc);
router.delete("/my-docs/:id", authMiddleware, deleteDoc);
router.patch("/my-docs/:id/favorite", authMiddleware, toggleFavorite);

// Check document name availability for the logged-in user
router.post("/check-name", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const existing = await Doc.findOne({ name, user: req.user.id });
    return res.json({ available: !existing });
  } catch (err) {
    console.error("Check name error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- IMAGE UPLOAD ROUTE -----------------
router.post(
  "/upload-image",
  authMiddleware,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    // Return URL of uploaded image
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/docs/${req.file.filename}`;
    res.json({ url: imageUrl });
  }
);

export default router;
