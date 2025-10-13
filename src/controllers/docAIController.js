// backend/src/controllers/docAIController.js
import nodemailer from "nodemailer";

export const sendEarlyAccessEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Configure mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // or use your SMTP provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Compose mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to your admin email
      subject: "New DocAI Early Access Request",
      text: `New signup request for DocAI early access:\n\nEmail: ${email}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Request submitted successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Server error, please try again later" });
  }
};
