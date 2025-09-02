import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: "" },
  category: { type: String, enum: ["Breakfast", "Lunch", "Drinks", "Snacks"], required: true },
  isSpecial: { type: Boolean, default: false },
  stock: { type: Number, default: -1 }, // -1 for unlimited
  isOutOfStock: { type: Boolean, default: false },
  prepTimeMinutes: { type: Number, default: 5 }
}, { timestamps: true });

export default mongoose.model("MenuItem", MenuItemSchema);
