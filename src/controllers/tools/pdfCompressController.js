import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

// 📦 Compress PDF Controller
export const compressPdf = async (req, res) => {
  try {
    // 🛡️ Check file
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { mode } = req.body; // extreme | recommended | low
    const inputPath = req.file.path; // path in uploads/temp/
    const outputDir = "uploads/docs/";
    const outputPath = path.join(outputDir, `${Date.now()}-compressed.pdf`);

    // Ensure output folder exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 🧠 Load and compress PDF
    const inputBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(inputBytes);

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      compress: true,
    });

    fs.writeFileSync(outputPath, compressedBytes);

    // 📊 File size info
    const originalSize = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2);
    const compressedSize = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);

    // 🧹 Delete temp upload
    fs.unlinkSync(inputPath);

    // ✅ Send compressed file to client
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="compressed.pdf"`,
      "X-Original-Size-MB": originalSize,
      "X-Compressed-Size-MB": compressedSize,
    });

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res).on("finish", () => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error("❌ Compression failed:", err);
    res.status(500).json({ message: "Server error while compressing PDF" });
  }
};
