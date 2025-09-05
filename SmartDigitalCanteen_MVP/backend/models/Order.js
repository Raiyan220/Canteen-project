// backend/models/Order.js (ENHANCED - add one field)
import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: String,
  price: Number,
  qty: { type: Number, default: 1 }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  customerName: { type: String, default: "Guest" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // NEW OPTIONAL FIELD
  items: [OrderItemSchema],
  total: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Preparing", "Ready", "Collected", "Cancelled"], default: "Pending" },
  placedAt: { type: Date, default: Date.now },
  estimatedReadyAt: { type: Date },
  cancelledAt: { type: Date, default: null },
  collectedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Order", OrderSchema);
