import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendEmail } from "../utils/sendEmail.js";


// Signup
export const signup = async (req, res) => {
  try {
    const debug = req.headers["x-debug"] === "1" || req.query.debug === "1";
    const timers = {};
    const now = () => Date.now();
    timers.totalStart = now();
    const { username, firstName, lastName, email, password, dateOfBirth, gender } = req.body;

    // ✅ Check for duplicate username
  timers.checkUsernameStart = now();
  const existingUsername = await User.findOne({ username });
  timers.checkUsernameEnd = now();
    if (existingUsername) {
      console.timeEnd("signup-total");
      return res.status(400).json({ message: "Username already taken" });
    }

    // ✅ Check for duplicate email
  timers.checkEmailStart = now();
  const existingUser = await User.findOne({ email });
  timers.checkEmailEnd = now();
    if (existingUser) {
      console.timeEnd("signup-total");
      return res.status(400).json({ message: "Email already registered" });
    }

  timers.hashStart = now();
  const hashedPassword = await bcrypt.hash(password, 10);
  timers.hashEnd = now();

    const user = new User({
      username,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      dateOfBirth,
      gender,
    });

  timers.saveStart = now();
  await user.save();
  timers.saveEnd = now();

    // ✅ Return JWT for auto login
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    timers.totalEnd = now();
    if (debug) {
      const timings = {
        checkUsername: timers.checkUsernameEnd - timers.checkUsernameStart,
        checkEmail: timers.checkEmailEnd - timers.checkEmailStart,
        hash: timers.hashEnd - timers.hashStart,
        save: timers.saveEnd - timers.saveStart,
        total: timers.totalEnd - timers.totalStart,
      };
      return res.status(201).json({ message: "User created successfully", token, timings });
    }
    res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const debug = req.headers["x-debug"] === "1" || req.query.debug === "1";
    const timers = {};
    const now = () => Date.now();
    timers.totalStart = now();
    const { email, password } = req.body;

  timers.findStart = now();
  const user = await User.findOne({ email });
  timers.findEnd = now();
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

  timers.compareStart = now();
  const isMatch = await bcrypt.compare(password, user.password);
  timers.compareEnd = now();
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    timers.tokenStart = now();
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    timers.tokenEnd = now();
    timers.totalEnd = now();

    if (debug) {
      const timings = {
        find: timers.findEnd - timers.findStart,
        compare: timers.compareEnd - timers.compareStart,
        token: timers.tokenEnd - timers.tokenStart,
        total: timers.totalEnd - timers.totalStart,
      };
      return res.json({ token, timings });
    }

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ API to check username availability
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    const existing = await User.findOne({ username });
    if (existing) {
      return res.json({ available: false });
    }
    res.json({ available: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



// ✅ Step 1: Send OTP
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await Otp.deleteMany({ email }); // remove old OTPs
    await Otp.create({ email, otp });
    
     // 🌈 Beautiful, colored HTML email template
    const message = `
      <div style="
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #E8EAF6, #E3F2FD);
        padding: 40px 20px;
        border-radius: 12px;
        color: #333;
        max-width: 500px;
        margin: auto;
        box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      ">
        <div style="text-align:center;">
          <h2 style="
            background: linear-gradient(90deg, #3F51B5, #1E88E5);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            display: inline-block;
            letter-spacing: 1px;
            font-size: 22px;
          ">
            VIADOCS
          </h2>
        </div>

        <h2 style="text-align:center; color:#1E88E5; margin-top:25px;">
          Password Reset Verification
        </h2>

        <p style="text-align:center; font-size:15px; color:#555; line-height:1.6;">
          Hello <strong>${user.firstName || user.username}</strong>,<br/>
          We received a request to reset your password. Use the following code to verify your account:
        </p>

        <div style="
          text-align:center;
          margin: 30px 0;
          background: #fff;
          border: 2px dashed #3F51B5;
          border-radius: 8px;
          display: inline-block;
          padding: 15px 25px;
        ">
          <span style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #1E88E5;
          ">${otp}</span>
        </div>

        <p style="text-align:center; color:#777; font-size:14px;">
          This code will expire in <b>5 minutes</b>.<br/>
          If you didn’t request a password reset, please ignore this email.
        </p>

        <hr style="margin:35px 0; border:none; border-top:1px solid #ddd;" />

        <p style="text-align:center; font-size:12px; color:#999;">
          © ${new Date().getFullYear()} Viadocs | All Rights Reserved<br/>
          Need help? <a href="mailto:contact.viadocs@gmail.com" style="color:#1E88E5; text-decoration:none;">contact.viadocs@gmail.com</a>
        </p>
      </div>
    `;
   

    await sendEmail(email, "Your OTP Code", message);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error sending OTP" });
  }
};

// ✅ Step 2: Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP" });

    await Otp.deleteMany({ email }); // clean up OTPs
    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

// ✅ Step 3: Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error resetting password" });
  }
};

// Verify token and return user info if valid (used by frontend to check session)
export const verifyToken = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.json({ loggedIn: false });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.json({ loggedIn: false });
      return res.json({ loggedIn: true, user });
    } catch (err) {
      return res.json({ loggedIn: false });
    }
  } catch (err) {
    console.error("Verify token error:", err);
    res.status(500).json({ loggedIn: false });
  }
};