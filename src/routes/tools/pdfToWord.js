import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import upload from "../../middleware/toolupload.js";

const router = express.Router();

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const inputPath = path.resolve(req.file.path); // stored in uploads/temp
  const outputPath = path.resolve(
    `uploads/temp/${Date.now()}-converted.docx`
  );

  console.log("[PDFtoWord] Input file:", inputPath);
  console.log("[PDFtoWord] Output file:", outputPath);

  const pythonProcess = spawn("python", [
    "tools.py",
    "pdf-to-word",
    inputPath,
    outputPath,
  ]);

  pythonProcess.stdout.on("data", (data) => {
    console.log(`[Python stdout]: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`[Python stderr]: ${data}`);
  });

  pythonProcess.on("close", () => {
    if (fs.existsSync(outputPath)) {
      res.download(outputPath, "converted.docx", (err) => {
        if (err) console.error("Download error:", err);

        // cleanup input + output after sending
        try {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        } catch (err) {
          console.error("Cleanup failed:", err);
        }
      });
    } else {
      res.status(500).json({ error: "Conversion failed" });
    }
  });
});

export default router;
