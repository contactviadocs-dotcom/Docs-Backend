import express from "express";
import multer from "multer";
import PDFDocument from "pdfkit";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.array("images"), (req, res) => {
  try {
    const doc = new PDFDocument({ autoFirstPage: false });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=images.pdf");

    doc.pipe(res);

    req.files.forEach((file) => {
      const img = doc.openImage(file.path);
      doc.addPage({ size: [img.width, img.height] });
      doc.image(img, 0, 0);
      fs.unlinkSync(file.path); // cleanup after use
    });

    doc.end();
  } catch (err) {
    console.error("ImageToPDF error:", err);
    res.status(500).json({ message: "Failed to convert images to PDF" });
  }
});

export default router;
