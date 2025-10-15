import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) return res.status(401).json({ message: "Invalid token" });

    next();
  } catch (err) {
    // Handle expired tokens specifically so frontend can act accordingly
    if (err && err.name === "TokenExpiredError") {
      // don't leak full error object in prod logs
      console.warn("Auth token expired at", err.expiredAt);
      return res.status(401).json({ message: "Token expired", expiredAt: err.expiredAt });
    }

    console.error("Auth error:", err && err.message ? err.message : err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;
