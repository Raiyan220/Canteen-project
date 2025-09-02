import MenuItem from "../models/MenuItem.js";

// List menu items with optional filters
export async function listMenu(req, res) {
  try {
    const { category, search, specials } = req.query;
    const q = {};
    if (category) q.category = category;
    if (specials === "true") q.isSpecial = true;
    if (search) q.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
    const items = await MenuItem.find(q).sort({ isSpecial: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single menu item by ID
export async function getMenuItem(req, res) {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Create a new menu item
export async function createMenuItem(req, res) {
  try {
    const { name, price, stock = -1 } = req.body;
    if (!name || price == null) return res.status(400).json({ error: "Name and price are required" });

    // Ensure stock is valid
    const stockValue = parseInt(stock, 10);
    const item = await MenuItem.create({
      ...req.body,
      stock: isNaN(stockValue) ? -1 : stockValue,
      isOutOfStock: stockValue === 0
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Update existing menu item
export async function updateMenuItem(req, res) {
  try {
    const updates = { ...req.body };
    if (updates.stock != null) {
      const stockValue = parseInt(updates.stock, 10);
      updates.stock = isNaN(stockValue) ? -1 : stockValue;
      updates.isOutOfStock = stockValue === 0;
    }
    const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Delete menu item
export async function deleteMenuItem(req, res) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
