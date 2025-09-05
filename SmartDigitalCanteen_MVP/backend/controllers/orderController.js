// backend/controllers/orderController.js (COMPLETE FILE)
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";

function computeEstimatedReady(items) {
  const maxMinutes = items.reduce((acc, it) => Math.max(acc, (it.prepTimeMinutes || 5) * it.qty), 5);
  const eta = new Date(Date.now() + maxMinutes * 60000);
  return eta;
}

export async function createOrder(req, res) {
  try {
    // Support both authenticated and guest users
    let customerName = req.body.customerName || "Guest";
    let userId = null;
    
    // If user is authenticated, use their info
    if (req.user) {
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(req.user.userId);
      if (user) {
        customerName = user.username;
        userId = user._id;
      }
    }

    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }
    
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
    
    // Create order data
    const orderData = {
      customerName,
      items: orderItems,
      total,
      estimatedReadyAt: eta
    };
    
    if (userId) {
      orderData.userId = userId;
    }
    
    const order = await Order.create(orderData);

    // Update stock
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
    // If user is authenticated, fetch by userId first
    if (req.user) {
      const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
      return res.json(orders);
    }

    // Fallback to customerName for guest users
    const { customerName } = req.query;
    if (!customerName) {
      return res.status(400).json({ error: "customerName is required for guest users" });
    }

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

export async function listActiveOrders(req, res) {
  try {
    const orders = await Order.find({ status: { $in: ["Pending", "Preparing", "Ready"] } })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Not found" });

    const validStatuses = ["Pending", "Preparing", "Ready", "Collected", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    order.status = status;
    if (status === "Cancelled") order.cancelledAt = new Date();
    if (status === "Collected") order.collectedAt = new Date();
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
