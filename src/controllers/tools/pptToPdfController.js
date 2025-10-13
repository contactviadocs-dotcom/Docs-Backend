import path from "path";
import { exec } from "child_process";
import fs from "fs";

export const convertPptToPdf = async (req, res) => {
  try {
    const inputFilePath = req.file.path;
    const outputDir = path.resolve("uploads/pdf");
    const fileName = path.parse(req.file.originalname).name;
    const outputFileName = `${fileName}-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    // Run LibreOffice conversion
    const command = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf --outdir "${outputDir}" "${inputFilePath}"`;
    console.log("🚀 Running:", command);

    exec(command, (error) => {
      if (error) {
        console.error("❌ Conversion error:", error);
        return res.status(500).json({ success: false, message: "Conversion failed" });
      }

      if (!fs.existsSync(outputPath)) {
        // Find the actual generated PDF file (LibreOffice might name it differently)
        const files = fs.readdirSync(outputDir);
        const recentPdf = files.find((f) => f.startsWith(fileName) && f.endsWith(".pdf"));
        if (!recentPdf) {
          return res.status(404).json({ success: false, message: "PDF not found" });
        }

        // Build correct download URL
        const downloadUrl = `http://localhost:5000/api/tools/ppt-to-pdf/download/${recentPdf}`;
        return res.json({ success: true, pdfUrl: downloadUrl });
      }

      // ✅ Send PDF URL for download
      const pdfUrl = `http://localhost:5000/api/tools/ppt-to-pdf/download/${outputFileName}`;
      res.json({ success: true, pdfUrl });
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
