import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js"; // Feedback route

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Smart Digital Canteen API" });
});

// API routes
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes); // Integrated feedback

export default app;
