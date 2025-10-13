// backend/src/routes/tools/wordToPdf.js
import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import multer from "multer";

const router = express.Router();

// ✅ Ensure temp folder exists
const uploadDir = "uploads/temp";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// POST /api/tools/word-to-pdf
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No Word file uploaded" });
  }

  const inputPath = path.resolve(req.file.path);
  const outputPath = path.resolve(
    `${uploadDir}/${Date.now()}-${path.basename(
      req.file.originalname,
      path.extname(req.file.originalname)
    )}.pdf`
  );

  console.log(`[WordToPDF] Input: ${inputPath}`);
  console.log(`[WordToPDF] Output: ${outputPath}`);

  // 🔹 Call Python script
  const pythonProcess = spawn("python", [
    "tools.py",
    "word-to-pdf",
    inputPath,
    outputPath,
  ]);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`[Python stdout]: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`[Python stderr]: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`[Python exited with code ${code}]`);

    if (fs.existsSync(outputPath)) {
      res.download(outputPath, "converted.pdf", (err) => {
        if (err) {
          console.error("Download error:", err);
        }
        // cleanup files after download
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    } else {
      res.status(500).json({ error: "Conversion failed. No output file." });
    }
  });
});

export default router;
