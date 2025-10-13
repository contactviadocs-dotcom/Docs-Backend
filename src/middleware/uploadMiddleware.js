// backend/src/middleware/uploadMiddleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload folder exists
const uploadPath = "uploads/profiles";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}${ext}`); // overwrite same user image
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"), false);
};

export default multer({ storage, fileFilter });
