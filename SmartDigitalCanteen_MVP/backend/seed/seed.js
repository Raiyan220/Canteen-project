// scripts/seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';

const data = [
  { name: "Cheese Burger", description: "Beef patty, cheese", price: 80, category: "Lunch", imageUrl: "/images/burger.svg", prepTimeMinutes: 10, stock: 20, isSpecial: false },
  { name: "Pancake", description: "Sweet pancakes", price: 40, category: "Breakfast", imageUrl: "/images/pancake.svg", prepTimeMinutes: 7, stock: 15, isSpecial: true },
  { name: "Iced Tea", description: "Chilled, refreshing", price: 20, category: "Drinks", imageUrl: "/images/tea.svg", prepTimeMinutes: 2, stock: -1, isSpecial: false },
  { name: "French Fries", description: "Crispy fries", price: 25, category: "Snacks", imageUrl: "/images/fries.svg", prepTimeMinutes: 5, stock: 30, isSpecial: false }
];

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('❌ MONGO_URI missing in .env');
  process.exit(1);
}

function redact(u) {
  return u.replace(/\/\/([^:@/]+):([^@/]+)@/, '//<user>:<12345>@');
}

(async () => {
  try {
    console.log('🔌 Connecting to:', redact(uri));
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected. Host:', mongoose.connection.host, ' DB:', mongoose.connection.name);

    console.log('🧹 Clearing existing MenuItem docs…');
    await MenuItem.deleteMany({});

    console.log('📦 Inserting seed data…');
    const res = await MenuItem.insertMany(data);

    console.log(`🎉 Seeded ${res.length} items into "${mongoose.connection.name}.menuitems"`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔒 Disconnected');
  }
})();
