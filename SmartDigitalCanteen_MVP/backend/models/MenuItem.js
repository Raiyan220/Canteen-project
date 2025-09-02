import mongoose from "mongoose";

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: "" },
  category: { type: String, enum: ["Breakfast", "Lunch", "Drinks", "Snacks"], required: true },
  isSpecial: { type: Boolean, default: false },
  stock: { type: Number, default: -1 }, // -1 = unlimited
  isOutOfStock: { type: Boolean, default: false },
  prepTimeMinutes: { type: Number, default: 5 }
}, { timestamps: true });

// Middleware to auto-update isOutOfStock based on stock
MenuItemSchema.pre("save", function(next) {
  if (this.stock === 0) this.isOutOfStock = true;
  if (this.stock > 0) this.isOutOfStock = false;
  next();
});

export default mongoose.model("MenuItem", MenuItemSchema);
