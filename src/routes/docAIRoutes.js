// backend/src/routes/docAIRoutes.js
import express from "express";
import { sendEarlyAccessEmail } from "../controllers/docAIController.js";

const router = express.Router();

router.post("/early-access", sendEarlyAccessEmail);

export default router;
