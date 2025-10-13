import express from "express";
import multer from "multer";
import authMiddleware from "../../middleware/authMiddleware.js";
import { compressPdf } from "../../controllers/tools/pdfCompressController.js";

const router = express.Router();

// 🗂️ Multer setup for temp folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/temp/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Route: /api/tools/pdf/compress
router.post("/compress", authMiddleware, upload.single("file"), compressPdf);

export default router;
