// import express from "express";
// import cors from "cors";
// import path, { dirname } from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import toolsRoutes from "./routes/tools.js";
// import authRoutes from "./routes/auth.js";
// import docsRoutes from "./routes/docs.js";
// import uploadRoutes from "./routes/upload.js";
// import profileRoutes from "./routes/profile.js";
// import fileUpload from "express-fileupload";
// import contactRoutes from "./routes/contactRoutes.js";
// import feedbackRoutes from "./routes/feedbackRoutes.js";
// import docAIRoutes from "./routes/docAIRoutes.js"; 

// dotenv.config();
// connectDB();

// const app = express();

// // Configure CORS to accept the frontend origin(s). Prefer environment variable
// // `CLIENT_URL` (single) or `CLIENT_URLS` (comma-separated) when available.
// const defaultOrigins = ["http://localhost:3000", "http://localhost:3001"];
// const envOrigins = [];
// if (process.env.CLIENT_URL) envOrigins.push(process.env.CLIENT_URL);
// if (process.env.CLIENT_URLS) {
//   envOrigins.push(...process.env.CLIENT_URLS.split(",").map((s) => s.trim()));
// }
// const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // allow requests with no origin (like mobile apps, curl, Postman)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) !== -1) {
//         return callback(null, true);
//       }
//       return callback(new Error("CORS policy: This origin is not allowed"), false);
//     },
//     credentials: true,
//     optionsSuccessStatus: 200,
//   })
// );

// app.use(express.json());

// // ✅ Proper directory setup
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // ✅ Serve the real uploads folder (one level above /src)
// const uploadsDir = path.resolve(__dirname, "../uploads");
// app.use("/uploads", express.static(uploadsDir));
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// console.log("🗂 Serving uploads from:", uploadsDir);

// // ✅ Routes
// app.use("/api", authRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/docs", docsRoutes);
// app.use("/api/upload", uploadRoutes);
// app.use("/api/profile", profileRoutes);
// app.use("/api/tools", toolsRoutes);
// app.use(fileUpload());
// app.use("/api/feedback", feedbackRoutes);
// app.use("/api/contact", contactRoutes);
// app.use("/api/docai", docAIRoutes);

// // ✅ Root check
// app.get("/", (req, res) => res.send("✅ Backend running"));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });


import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import toolsRoutes from "./routes/tools.js";
import authRoutes from "./routes/auth.js";
import docsRoutes from "./routes/docs.js";
import uploadRoutes from "./routes/upload.js";
import profileRoutes from "./routes/profile.js";
import fileUpload from "express-fileupload";
import contactRoutes from "./routes/contactRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import docAIRoutes from "./routes/docAIRoutes.js";

// ✅ Resolve paths and load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ✅ Connect to MongoDB
connectDB();

const app = express();

// ✅ Define allowed origins (frontend URLs)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://docs-frontend-nu.vercel.app", // your Vercel frontend
];

// ✅ CORS middleware (stable for Render + Vercel)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Handle preflight requests globally
app.options("*", cors());

// ✅ Middleware
app.use(express.json());
app.use(fileUpload());

// ✅ Serve static uploads folder
const uploadsDir = path.resolve(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));
console.log("🗂 Serving uploads from:", uploadsDir);

// ✅ Routes
app.use("/api", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/docai", docAIRoutes);

// ✅ Root endpoint
app.get("/", (req, res) => res.send("✅ Backend running successfully 🚀"));

// ✅ Start server only after DB is connected
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message || err);
    process.exit(1);
  }
};

start();
