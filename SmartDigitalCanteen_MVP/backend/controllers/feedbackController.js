import Feedback from "../models/Feedback.js";

export async function createFeedback(req, res) {
  try {
    const { orderId, rating, comment = "" } = req.body;
    if (!orderId || !rating) return res.status(400).json({ error: "orderId and rating are required" });
    const fb = await Feedback.create({ orderId, rating, comment });
    res.status(201).json(fb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listFeedback(req, res) {
  try {
    const { orderId } = req.query;
    const q = orderId ? { orderId } : {};
    const list = await Feedback.find(q).sort({ createdAt: -1 }).limit(100);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
