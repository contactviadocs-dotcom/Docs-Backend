import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const router = express.Router();

// 🗂️ Upload directory
const uploadDir = path.join(process.cwd(), "uploads", "tools");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 📂 Multer setup
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({ storage });

// 🎯 Route: /api/tools/excel-to-pdf
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const inputPath = req.file.path;
  const outputPath = path.join(
    uploadDir,
    `${path.parse(req.file.filename).name}.pdf`
  );

  console.log("📥 Uploaded:", inputPath);

  // 🐍 Run Python converter
  const python = spawn("python", [
    path.join(process.cwd(), "tools.py"),
    "excel-to-pdf",
    inputPath,
    outputPath,
  ]);

  let errorOutput = "";

  python.stdout.on("data", (data) => {
    console.log("🐍 Python:", data.toString());
  });

  python.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  python.on("close", (code) => {
    if (code === 0 && fs.existsSync(outputPath)) {
      console.log("✅ PDF generated:", outputPath);
      const fileUrl = `/uploads/tools/${path.basename(outputPath)}`;
      res.json({ success: true, file: fileUrl });
    } else {
      console.error("❌ Conversion failed:", errorOutput);
      res.status(500).json({
        success: false,
        message: "Conversion failed",
        error: errorOutput || "Unknown error",
      });
    }
  });
});

export default router;
