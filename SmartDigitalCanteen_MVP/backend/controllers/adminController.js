import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

/**
 * List active orders for admin dashboard.
 * Optional query: status (Pending, Preparing, Ready)
 */
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

/**
 * Update the status of a specific order.
 * Body: { status: "Pending"|"Preparing"|"Ready"|"Collected"|"Cancelled" }
 */
export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["Pending", "Preparing", "Ready", "Collected", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    if (status === "Collected") order.collectedAt = new Date();
    if (status === "Cancelled") order.cancelledAt = new Date();

    await order.save();

    res.json(order);
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Generate a daily report for admin.
 * Returns total orders, revenue, and top-selling items.
 */
export async function reportDaily(req, res) {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: "Cancelled" },
    });

    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Calculate top-selling items
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

    res.json({
      date: start.toISOString().slice(0, 10),
      totalOrders,
      revenue,
      topSelling,
    });
  } catch (err) {
    console.error("reportDaily error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Generate a sales report for a custom date range.
 * Query params: start=YYYY-MM-DD, end=YYYY-MM-DD
 */
export async function reportSales(req, res) {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "Start and end dates are required" });
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: "Cancelled" },
    });

    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Calculate top-selling items
    const counts = new Map();
    orders.forEach((o) => {
      o.items.forEach((it) => {
        counts.set(it.name, (counts.get(it.name) || 0) + it.qty);
      });
    });
    const topSelling = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, qty]) => ({ name, qty }));

    res.json({
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
      totalOrders,
      revenue,
      topSelling,
    });
  } catch (err) {
    console.error("reportSales error:", err);
    res.status(500).json({ error: err.message });
  }
}
