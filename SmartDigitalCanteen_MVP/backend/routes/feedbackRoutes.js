import { Router } from "express";
import { createFeedback, listFeedback } from "../controllers/feedbackController.js";

const router = Router();

// Create new feedback
router.post("/", createFeedback);

// List feedback (optionally by orderId)
router.get("/", listFeedback);

export default router;
