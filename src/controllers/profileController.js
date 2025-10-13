// controllers/profileController.js
import User from "../models/User.js";
import path from "path";

// ----------------------------
// GET PROFILE
// ----------------------------
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    // Build absolute URL for profileImage when stored as relative path
    let profileImageUrl = "";
    if (user.profileImage) {
      profileImageUrl = user.profileImage.startsWith("http")
        ? user.profileImage
        : `${req.protocol}://${req.get("host")}/uploads/profiles/${path.basename(user.profileImage)}`;
    }

    // debug: log stored value and returned URL
    console.debug("[getProfile] stored profileImage:", user.profileImage, "-> returned:", profileImageUrl);

    res.json({ ...user.toObject(), fullName, profileImage: profileImageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------
// UPDATE PROFILE TEXT FIELDS
// ----------------------------
export const updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    let profileImageUrl = "";
    if (user.profileImage) {
      profileImageUrl = user.profileImage.startsWith("http")
        ? user.profileImage
        : `${req.protocol}://${req.get("host")}/uploads/profiles/${path.basename(user.profileImage)}`;
    }

    // debug: log stored value and returned URL
    console.debug("[updateProfile] stored profileImage:", user.profileImage, "-> returned:", profileImageUrl);

    res.json({ ...user.toObject(), fullName, profileImage: profileImageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------
// UPLOAD PROFILE IMAGE
// ----------------------------
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const imagePath = `/uploads/profiles/${req.file.filename}`; // stored path
    // persist to DB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imagePath },
      { new: true }
    ).select("-password");

    const profileImageUrl = `${req.protocol}://${req.get("host")}${imagePath}`;

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    res.json({ ...user.toObject(), fullName, profileImage: profileImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


