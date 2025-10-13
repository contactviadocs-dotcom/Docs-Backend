import express from "express";
import multer from "multer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/pdfToImage/" });

router.post("/", upload.single("pdf"), (req, res) => {
  const pdfPath = req.file.path;
  const outputDir = `uploads/pdfToImage/${Date.now()}`;
  fs.mkdirSync(outputDir, { recursive: true });

  const command = `python tools.py pdf-to-image "${pdfPath}" "${outputDir}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(stderr);
      return res.status(500).json({ message: "Conversion failed" });
    }

    const output = stdout.trim();
    if (output.endsWith(".zip")) {
      return res.json({
        message: "PDF converted successfully (multiple pages)",
        zipUrl: `http://localhost:5000/${output}`,
      });
    } else if (output.endsWith(".png")) {
      return res.json({
        message: "PDF converted successfully",
        imageUrl: `http://localhost:5000/${output}`,
      });
    } else {
      res.status(500).json({ message: "Unexpected output" });
    }
  });
});

export default router;
