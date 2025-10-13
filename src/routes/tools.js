import express from "express";
import pdfToWord from "./tools/pdfToWord.js";
import wordToPdf from "./tools/wordToPdf.js";
import pdfMerge from "./tools/pdfMerge.js";
import pdfSplit from "./tools/pdfSplit.js";
import pdfCompress from "./tools/pdfCompress.js";
import imageToPdf from "./tools/imageToPdf.js";
import pdfToImage from "./tools/pdfToImage.js";
import passwordProtect from "./tools/passwordProtect.js";
import unlockPdf from "./tools/unlockPdf.js";
import excelToPdf from "./tools/excelToPdf.js"; // ✅ Import new route
import powerpointToPdf from "./tools/powerpointToPdf.js";
import docTranslator from "./tools/docTranslator.js";
import pdfEditor from "./tools/pdfEditor.js";



const router = express.Router();

router.use("/pdf-to-word", pdfToWord);
router.use("/word-to-pdf", wordToPdf);
router.use("/pdf-merge", pdfMerge);
router.use("/pdf-split", pdfSplit);
router.use("/pdf", pdfCompress);
router.use("/image-to-pdf", imageToPdf);
router.use("/pdf-to-image", pdfToImage);
router.use("/password-protect", passwordProtect);
router.use("/unlock-pdf", unlockPdf);
router.use("/excel-to-pdf", excelToPdf); // ✅ Excel→PDF route
router.use("/ppt-to-pdf", powerpointToPdf);
router.use("/doc-translator", docTranslator);
router.use("/pdf-editor", pdfEditor);



export default router;
