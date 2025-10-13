// backend/src/routes/tools/unlockPdf.js
import express from "express";
import fileUpload from "express-fileupload";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);
const router = express.Router();
router.use(fileUpload());

// === UPDATE THIS to your qpdf path if different ===
const qpdfPath = `"C:\\Program Files\\qpdf 12.2.0\\bin\\qpdf.exe"`;

// Helper to cleanup files safely
const safeUnlink = (p) => {
  try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { console.error("unlink error", e); }
};

// POST /api/tools/unlock-pdf/check
// Accepts a single file upload (pdfFile). Returns { locked: boolean, type: "none"|"owner"|"user"|"unknown", message }
router.post("/check", async (req, res) => {
  if (!req.files || !req.files.pdfFile) {
    return res.status(400).json({ message: "No PDF uploaded." });
  }

  const pdfFile = req.files.pdfFile;
  const uploadDir = path.join("uploads", "docs");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const uploadPath = path.join(uploadDir, `${Date.now()}_${pdfFile.name}`);
  try {
    await pdfFile.mv(uploadPath);

    // Use qpdf to report encryption info
    // qpdf has --show-encryption which prints details about encryption or says "not encrypted"
    const cmd = `${qpdfPath} --show-encryption "${uploadPath}"`;
    try {
      const { stdout, stderr } = await execAsync(cmd, { windowsHide: true, timeout: 15_000 });

      const output = (stdout + "\n" + stderr).toLowerCase();

      // Interpret output: look for words
      if (output.includes("not encrypted") || output.includes("no encryption")) {
        safeUnlink(uploadPath);
        return res.json({ locked: false, type: "none", message: "PDF is not encrypted / already unlocked." });
      }

      // If qpdf prints encryption info, it may be owner-password or user-password
      // Typical qpdf lines include: "encryption algorithm" and "user password" vs "owner password"
      // We'll try to distinguish:
      const isUserEncrypted = output.includes("requires a password to open") || output.includes("user password");
      const isOwnerEncrypted = !isUserEncrypted; // if encrypted but not user-password typed messages then likely owner restrictions

      safeUnlink(uploadPath);

      if (isUserEncrypted) {
        return res.json({ locked: true, type: "user", message: "This PDF requires a password to open (user password)." });
      } else {
        return res.json({ locked: true, type: "owner", message: "This PDF has owner restrictions (printing/copying) but can be automatically unlocked." });
      }
    } catch (qerr) {
      // qpdf returned non-zero exit code or printed to stderr
      const stderr = (qerr.stderr || qerr.message || "").toString().toLowerCase();

      // If qpdf complains "invalid password" when checking, treat as user-encrypted
      if (stderr.includes("invalid password") || stderr.includes("wrong password")) {
        safeUnlink(uploadPath);
        return res.json({ locked: true, type: "user", message: "This PDF requires a password to open (user password)." });
      }

      // If qpdf says something else, return unknown
      safeUnlink(uploadPath);
      return res.json({ locked: true, type: "unknown", message: "Unable to determine encryption type. qpdf output: " + (qerr.stderr || qerr.message || "").toString().slice(0,300) });
    }
  } catch (err) {
    console.error("check error:", err);
    safeUnlink(uploadPath);
    return res.status(500).json({ message: "Server error while checking PDF" });
  }
});

// POST /api/tools/unlock-pdf/unlock
// Accepts file upload (pdfFile) and optional form field `password`.
// If password provided, uses it. Returns unlocked PDF file (download) or JSON error.
router.post("/unlock", async (req, res) => {
  if (!req.files || !req.files.pdfFile) {
    return res.status(400).json({ message: "No PDF uploaded." });
  }

  const pdfFile = req.files.pdfFile;
  const userPassword = (req.body.password || "").toString();
  const uploadDir = path.join("uploads", "docs");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const uploadPath = path.join(uploadDir, `${Date.now()}_${pdfFile.name}`);
  const unlockedPath = uploadPath.replace(/\.pdf$/i, "_unlocked.pdf");

  try {
    await pdfFile.mv(uploadPath);

    // Build qpdf decrypt command. If password provided, pass --password=<password>
    // Note: ensure password is properly escaped for cmd. We'll wrap it in double quotes.
    const passwordPart = userPassword ? ` --password="${userPassword.replace(/"/g, '\\"')}"` : "";
    const cmd = `${qpdfPath}${passwordPart} --decrypt "${uploadPath}" "${unlockedPath}"`;

    exec(cmd, { windowsHide: true, timeout: 30_000 }, (error, stdout, stderr) => {
      // Always remove the original upload after attempting
      if (fs.existsSync(uploadPath)) safeUnlink(uploadPath);

      const stderrStr = (stderr || "").toString();
      const stdoutStr = (stdout || "").toString();

      if (error) {
        console.error("❌ qpdf error:", error.message, stderrStr || stdoutStr);

        // Detect common failure modes:
        if (stderrStr.toLowerCase().includes("invalid password") || stderrStr.toLowerCase().includes("wrong password")) {
          // password provided but wrong
          safeUnlink(unlockedPath);
          return res.status(401).json({ message: "Invalid password. Could not decrypt the PDF." });
        }

        if (stderrStr.toLowerCase().includes("file is encrypted") || stderrStr.toLowerCase().includes("requires a password to open")) {
          safeUnlink(unlockedPath);
          return res.status(400).json({ message: "PDF is encrypted and requires a password to open." });
        }

        // If the command could not be found
        if (error.message.includes("not recognized") || error.message.includes("enoent")) {
          return res.status(500).json({
            message: "qpdf not found. Please ensure qpdf is installed and qpdfPath is correct in backend.",
          });
        }

        // Generic failure
        safeUnlink(unlockedPath);
        return res.status(400).json({ message: "Unable to unlock PDF automatically. qpdf error: " + (stderrStr || stdoutStr).slice(0,300) });
      }

      // Success — send file
      if (!fs.existsSync(unlockedPath)) {
        return res.status(500).json({ message: "Unlock failed — unlocked file not generated." });
      }

      res.download(unlockedPath, `${path.parse(pdfFile.name).name}_unlocked.pdf`, (err) => {
        if (err) console.error("download err", err);
        safeUnlink(unlockedPath);
      });
    });
  } catch (err) {
    console.error("unlock error:", err);
    safeUnlink(unlockedPath);
    safeUnlink(uploadPath);
    return res.status(500).json({ message: "Server error while unlocking PDF." });
  }
});

export default router;
