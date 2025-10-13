// backend/src/routes/tools/docTranslator.js
import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * POST /api/tools/doc-translator
 * Body: { text: string, targetLang: string }
 */
router.post("/", async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang)
      return res.status(400).json({ error: "Text and target language required." });

    // LibreTranslate API (public or self-hosted)
    const response = await axios.post("https://libretranslate.com/translate", {
      q: text,
      source: "auto",
      target: targetLang,
      format: "text",
    });

    res.json({ translatedText: response.data.translatedText });
  } catch (error) {
    console.error("Translation error:", error.message);
    res.status(500).json({ error: "Translation failed." });
  }
});

export default router;
