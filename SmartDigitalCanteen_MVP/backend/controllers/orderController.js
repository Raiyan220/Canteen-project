import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";

function computeEstimatedReady(items) {
  // estimate by taking max prepTimeMinutes * qty
  const maxMinutes = items.reduce((acc, it) => Math.max(acc, (it.prepTimeMinutes || 5) * it.qty), 5);
  const eta = new Date(Date.now() + maxMinutes * 60000);
  return eta;
}

export async function createOrder(req, res) {
  try {
    const { customerName = "Guest", items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }
    // Map incoming items to DB-verified data
    const menuIds = items.map(i => i.menuItemId);
    const menuDocs = await MenuItem.find({ _id: { $in: menuIds } });
    const menuMap = new Map(menuDocs.map(d => [String(d._id), d]));
    const orderItems = [];
    let total = 0;
    for (const i of items) {
      const m = menuMap.get(String(i.menuItemId));
      if (!m) return res.status(400).json({ error: "Invalid menu item: " + i.menuItemId });
      const qty = Math.max(1, parseInt(i.qty || 1, 10));
      if (m.isOutOfStock || (m.stock >= 0 && qty > m.stock)) {
        return res.status(400).json({ error: `Item out of stock: ${m.name}` });
      }
      orderItems.push({ menuItemId: m._id, name: m.name, price: m.price, qty });
      total += m.price * qty;
    }
    const eta = computeEstimatedReady(orderItems.map(it => {
      const m = menuMap.get(String(it.menuItemId));
      return { qty: it.qty, prepTimeMinutes: m?.prepTimeMinutes || 5 };
    }));
    const order = await Order.create({
      customerName,
      items: orderItems,
      total,
      estimatedReadyAt: eta
    });

    // decrement stock if finite
    for (const it of orderItems) {
      const m = menuMap.get(String(it.menuItemId));
      if (m.stock >= 0) {
        m.stock = Math.max(0, m.stock - it.qty);
        if (m.stock === 0) m.isOutOfStock = true;
        await m.save();
      }
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listOrdersByCustomer(req, res) {
  try {
    const { customerName } = req.query;
    if (!customerName) return res.status(400).json({ error: "customerName is required" });
    const orders = await Order.find({ customerName }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function cancelOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Not found" });
    if (order.status !== "Pending") {
      return res.status(400).json({ error: "Cannot cancel once preparing" });
    }
    order.status = "Cancelled";
    order.cancelledAt = new Date();
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
