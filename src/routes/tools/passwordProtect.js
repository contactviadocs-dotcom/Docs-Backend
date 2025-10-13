// ✅ backend/src/routes/tools/passwordProtect.js

import express from "express";
import { exec } from "child_process";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Folder for uploads
const upload = multer({ dest: "uploads/password/" });

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file || !req.body.password) {
      return res.status(400).json({ message: "Missing file or password" });
    }

    const { password } = req.body;
    const inputPath = req.file.path;
    const outputPath = path.join("uploads/password", `${Date.now()}_protected.pdf`);

    // ✅ Full path to QPDF executable
    const qpdfPath = `"C:\\Program Files\\qpdf 12.2.0\\bin\\qpdf.exe"`;

    // ✅ Use 256-bit AES encryption (secure)
    const cmd = `${qpdfPath} --encrypt ${password} ${password} 256 -- "${inputPath}" "${outputPath}"`;

    console.log("🔐 Running:", cmd);

    exec(cmd, (error, stdout, stderr) => {
      // Always delete uploaded file
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

      if (error) {
        console.error("❌ QPDF Error:", stderr || error.message);
        return res.status(500).json({
          message: "Failed to add password",
          error: stderr || error.message,
        });
      }

      console.log("✅ PDF password added successfully");

      // Send protected PDF back to client
      res.download(outputPath, "protected.pdf", (err) => {
        if (err) console.error("Download error:", err);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); // Cleanup
      });
    });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
