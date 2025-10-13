import express from "express";
import { pptUpload } from "../../middleware/tools/pptToPdfMiddleware.js";
import { convertPptToPdf } from "../../controllers/tools/pptToPdfController.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// Convert PPT → PDF
router.post("/", pptUpload, convertPptToPdf);

// 🔽 Download endpoint
router.get("/download/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.resolve(`uploads/pdf/${fileName}`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  // 🧠 Forces the browser to download instead of view
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).json({ success: false, message: "Error downloading file" });
    }
  });
});

export default router;
