import express from 'express';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Feedback from '../models/Feedback.js';

const router = express.Router();

const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  const expected = process.env.ADMIN_PASSWORD || 'demo_password';
  if (!adminKey || adminKey !== expected) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin key' });
  }
  next();
};

// Verify admin key cleanly without exposing password to client bundle
router.post('/verify', adminAuth, (req, res) => {
  res.json({ ok: true });
});

// MENU ROUTES
router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/menu', adminAuth, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.stock != null) {
      const parsed = parseInt(body.stock, 10);
      body.stock = isNaN(parsed) ? -1 : parsed;
      if (body.stock === 0) body.isOutOfStock = true;
    }
    const item = new MenuItem(body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/menu/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const updateData = { ...req.body };
    if (updateData.stock != null) {
      const parsed = parseInt(updateData.stock, 10);
      updateData.stock = isNaN(parsed) ? -1 : parsed;
      if (updateData.stock === 0) {
        updateData.isOutOfStock = true;
      } else if (updateData.stock > 0 && req.body.isOutOfStock === undefined) {
        updateData.isOutOfStock = false;
      }
    }

    Object.assign(item, updateData);
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/menu/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await MenuItem.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ORDER ROUTES
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status
      ? { status }
      : { status: { $in: ['Pending', 'Preparing', 'Ready'] } };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('items.menuItemId', 'name price category');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Collected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    if (status === 'Collected') {
      order.collectedAt = new Date();
    } else if (status === 'Cancelled') {
      order.cancelledAt = new Date();
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FEEDBACK ROUTE FOR ADMIN
router.get('/feedback', adminAuth, async (req, res) => {
  try {
    const list = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('orderId', 'customerName total status createdAt');
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REPORTS
router.get('/report/daily', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $nin: ['CANCELLED', 'Cancelled'] }
    });

    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    const counts = new Map();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        counts.set(item.name, (counts.get(item.name) || 0) + item.qty);
      });
    });

    const topSelling = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));

    res.json({
      date: today.toISOString().slice(0, 10),
      totalOrders,
      revenue,
      topSelling
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/report/sales', adminAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['CANCELLED', 'Cancelled'] }
    });

    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    const counts = new Map();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        counts.set(item.name, (counts.get(item.name) || 0) + item.qty);
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
      topSelling
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
