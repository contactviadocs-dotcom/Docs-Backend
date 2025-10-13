// backend/src/routes/tools/pdfMerge.js
import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import upload from "../../middleware/toolupload.js";

const router = express.Router();

router.post("/", upload.array("files", 10), (req, res) => {
  if (!req.files || req.files.length < 2) {
    return res.status(400).json({ error: "At least 2 PDF files required" });
  }

  const inputPaths = req.files.map((f) => path.resolve(f.path));
  const outputPath = path.resolve(`uploads/temp/${Date.now()}-merged.pdf`);

  console.log("[PDF Merge] Inputs:", inputPaths);
  console.log("[PDF Merge] Output:", outputPath);

  const pythonProcess = spawn("python", [
    "tools.py",
    "pdf-merge",
    ...inputPaths,
    outputPath,
  ]);

  pythonProcess.stdout.on("data", (data) =>
    console.log(`[Python]: ${data}`)
  );
  pythonProcess.stderr.on("data", (data) =>
    console.error(`[Python ERROR]: ${data}`)
  );

  pythonProcess.on("close", () => {
    if (fs.existsSync(outputPath)) {
      res.download(outputPath, "merged.pdf", (err) => {
        if (err) console.error("Download error:", err);
        try {
          req.files.forEach((f) => fs.unlinkSync(f.path)); // cleanup inputs
          fs.unlinkSync(outputPath); // cleanup output
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      });
    } else {
      res.status(500).json({ error: "Merge failed" });
    }
  });
});

export default router;
