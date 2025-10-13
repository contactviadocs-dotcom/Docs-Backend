import Feedback from "../models/Feedback.js";

export const submitFeedback = async (req, res) => {
  try {
    const { name, rating, message } = req.body;

    if (!name || !rating || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newFeedback = new Feedback({ name, rating, message });
    await newFeedback.save();

    res.status(200).json({ message: "Feedback submitted successfully!" });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ message: "Server error, please try again." });
  }
};
