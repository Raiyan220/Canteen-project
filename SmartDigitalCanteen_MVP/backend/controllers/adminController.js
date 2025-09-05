import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

export async function listActiveOrders(req, res) {
  try {
    const { status } = req.query;
    const query = status
      ? { status }
      : { status: { $in: ["Pending", "Preparing", "Ready"] } };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("items.menuItemId", "name price category");

    res.json(orders);
  } catch (err) {
    console.error("listActiveOrders error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Preparing", "Ready", "Collected", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    
    if (status === "Collected") {
      order.collectedAt = new Date();
    } else if (status === "Cancelled") {
      order.cancelledAt = new Date();
    }

    await order.save();
    console.log(`Order ${id} status updated to ${status}`);
    res.json(order);
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function reportDaily(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const orders = await Order.find({
      placedAt: { $gte: today, $lt: tomorrow },
      status: { $ne: "Cancelled" }
    });

    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const counts = new Map();
    orders.forEach((o) => {
      o.items.forEach((it) => {
        counts.set(it.name, (counts.get(it.name) || 0) + it.qty);
      });
    });

    const topSelling = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    res.json({ totalOrders, revenue, topSelling });
  } catch (err) {
    console.error("reportDaily error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function reportSales(req, res) {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Start and end dates required" });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      placedAt: { $gte: startDate, $lte: endDate },
      status: { $ne: "Cancelled" }
    });

    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const counts = new Map();
    orders.forEach((o) => {
      o.items.forEach((it) => {
        counts.set(it.name, (counts.get(it.name) || 0) + it.qty);
      });
    });

    const topSelling = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    res.json({ totalOrders, revenue, topSelling });
  } catch (err) {
    console.error("reportSales error:", err);
    res.status(500).json({ error: err.message });
  }
}
