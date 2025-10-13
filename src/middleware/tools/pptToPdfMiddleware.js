import multer from "multer";
import path from "path";
import fs from "fs";

// 📁 Ensure upload directories exist
const pptDir = path.resolve("uploads/ppt");
fs.mkdirSync(pptDir, { recursive: true });

// 🧱 Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pptDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only .ppt or .pptx files are allowed!"));
};

export const pptUpload = multer({ storage, fileFilter }).single("file");
