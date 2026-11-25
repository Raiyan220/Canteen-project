import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import MenuItem from "./models/MenuItem.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

const DEFAULT_MENU = [
  { name: "Crispy Cheese Burger", description: "Juicy seared beef patty with melted cheddar, crisp lettuce, and house crimson sauce.", price: 140, category: "Lunch", imageUrl: "/images/burger.svg", prepTimeMinutes: 10, stock: 25, isSpecial: true },
  { name: "Golden Honey Pancakes", description: "Fluffy buttermilk pancake stack drizzled with warm honey butter.", price: 85, category: "Breakfast", imageUrl: "/images/pancake.svg", prepTimeMinutes: 7, stock: 20, isSpecial: true },
  { name: "Spiced Iced Tea", description: "Freshly brewed chilled black tea infused with lemon and mint.", price: 45, category: "Drinks", imageUrl: "/images/tea.svg", prepTimeMinutes: 2, stock: -1, isSpecial: false },
  { name: "Peri-Peri Crispy Fries", description: "Golden double-fried potato fries dusted with smoky crimson peri-peri seasoning.", price: 70, category: "Snacks", imageUrl: "/images/fries.svg", prepTimeMinutes: 5, stock: 35, isSpecial: false },
  { name: "Crimson Grilled Chicken Wrap", description: "Char-grilled spiced chicken strips wrapped in warm flatbread with garlic sauce.", price: 165, category: "Lunch", imageUrl: "/images/burger.svg", prepTimeMinutes: 9, stock: 18, isSpecial: true },
  { name: "Masala Omelette Toast", description: "Spiced two-egg omelette with roasted tomatoes and toasted artisan bread.", price: 65, category: "Breakfast", imageUrl: "/images/pancake.svg", prepTimeMinutes: 6, stock: 24, isSpecial: false },
  { name: "Mint Lime Cooler", description: "Sparkling chilled limeade muddled with fresh garden mint leaves.", price: 55, category: "Drinks", imageUrl: "/images/tea.svg", prepTimeMinutes: 2, stock: -1, isSpecial: false },
  { name: "Loaded Nacho Crunch Box", description: "Crisp tortilla chips layered with warm cheese sauce and crimson salsa.", price: 110, category: "Snacks", imageUrl: "/images/fries.svg", prepTimeMinutes: 5, stock: 15, isSpecial: false }
];

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 })
    .then(async () => {
      console.log("MongoDB connected successfully");
      const count = await MenuItem.countDocuments();
      if (count === 0) {
        await MenuItem.insertMany(DEFAULT_MENU);
        console.log("Seeded default canteen menu items");
      }
    })
    .catch((err) => {
      console.warn("MongoDB unreachable, running with embedded store:", err.message);
    });
} else {
  console.log("No MONGO_URI provided; running with embedded persistent store.");
}
