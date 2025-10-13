import express from "express";
import multer from "multer";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const router = express.Router();

// ✅ Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// ✅ Your Python path
const pythonPath =
  "C:/Users/boppu/AppData/Local/Programs/Python/Python313/python.exe";

// ✅ Python script is directly in backend/
const scriptPath = path.join(process.cwd(), "tools.py");

router.post("/", upload.single("file"), (req, res) => {
  const inputPath = req.file.path;
  const ranges = req.body.ranges || "1-1";
  const outputDir = uploadDir;

  console.log("📂 Running Python script:", scriptPath);

  const py = spawn(pythonPath, [
    scriptPath,
    "pdf-split",
    inputPath,
    ranges,
    outputDir,
  ]);

  let result = "";

  py.stdout.on("data", (data) => {
    result += data.toString();
  });

  py.stderr.on("data", (data) => {
    console.error("🐍 PYTHON ERROR:", data.toString());
  });

  py.on("close", (code) => {
    console.log("🐍 Python exited with code:", code);

    const outputPath = result.trim().split("\n").pop();
    if (!outputPath || !fs.existsSync(outputPath)) {
      console.error("❌ Output file not found:", outputPath);
      return res.status(500).send("PDF split failed");
    }

    const filename = path.basename(outputPath);

    // ✅ Set correct headers
    res.setHeader(
      "Content-Type",
      filename.endsWith(".zip") ? "application/zip" : "application/pdf"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    // ✅ Send file safely
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error("⚠️ Send error:", err);
      }
      // Cleanup AFTER response
      setTimeout(() => {
        try {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (cleanupErr) {
          console.error("⚠️ Cleanup error:", cleanupErr);
        }
      }, 2000);
    });
  });
});

export default router;
