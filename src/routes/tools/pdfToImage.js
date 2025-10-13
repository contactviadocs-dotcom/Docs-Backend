import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const router = express.Router();

// ✅ Configure storage to preserve file extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/pdfToImage";
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

// ✅ POST /api/tools/pdf-to-image
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const pdfPath = req.file.path;
  const outputDir = `uploads/pdfToImage/${Date.now()}`;
  fs.mkdirSync(outputDir, { recursive: true });

  const command = `python tools.py pdf-to-image "${pdfPath}" "${outputDir}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Python Error:", stderr || error);
      return res.status(500).json({ success: false, message: "Conversion failed" });
    }

    const output = stdout.trim();
    if (!output) {
      console.error("Empty Python output");
      return res.status(500).json({ success: false, message: "Empty Python output" });
    }

    if (output.endsWith(".zip") || output.endsWith(".png")) {
      return res.json({
        success: true,
        file: `/${output.replace(/\\/g, "/")}`,
      });
    }

    console.error("Unexpected Python output:", output);
    res.status(500).json({ success: false, message: "Unexpected Python output" });
  });
});

export default router;
