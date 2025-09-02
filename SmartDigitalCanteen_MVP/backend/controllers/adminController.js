import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

export async function listActiveOrders(req, res) {
  try {
    const { status } = req.query;
    const q = status ? { status } : { status: { $in: ["Pending", "Preparing", "Ready"] } };
    const orders = await Order.find(q).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ["Pending", "Preparing", "Ready", "Collected", "Cancelled"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Not found" });
    order.status = status;
    if (status === "Collected") order.collectedAt = new Date();
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function reportDaily(req, res) {
  try {
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(23,59,59,999);
    const orders = await Order.find({ createdAt: { $gte: start, $lte: end }, status: { $ne: "Cancelled" } });
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    // top-selling items
    const counts = new Map();
    orders.forEach(o => {
      o.items.forEach(it => {
        counts.set(it.name, (counts.get(it.name) || 0) + it.qty);
      });
    });
    const topSelling = [...counts.entries()].sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
    res.json({ date: start.toISOString().slice(0,10), totalOrders, revenue, topSelling });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
