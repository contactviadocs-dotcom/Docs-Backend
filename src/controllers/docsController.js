import Doc from "../models/Doc.js";

// Create a new document
export const createDoc = async (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const doc = new Doc({ name, content, user: req.user.id });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    console.error("Create doc error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all documents for the logged-in user
export const getDocs = async (req, res) => {
  try {
    const docs = await Doc.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error("Get docs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single document by ID
export const getDocById = async (req, res) => {
  try {
    const doc = await Doc.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json(doc);
  } catch (err) {
    console.error("Get doc by id error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a document
export const updateDoc = async (req, res) => {
  try {
    const { name, content } = req.body;
    const doc = await Doc.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, content },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json(doc);
  } catch (err) {
    console.error("Update doc error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a document
export const deleteDoc = async (req, res) => {
  try {
    const doc = await Doc.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error("Delete doc error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle favorite
export const toggleFavorite = async (req, res) => {
  try {
    const doc = await Doc.findOne({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    doc.favorite = !doc.favorite;
    await doc.save();
    res.json({ favorite: doc.favorite });
  } catch (err) {
    console.error("Toggle favorite error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
