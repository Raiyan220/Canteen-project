import express from 'express';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

const router = express.Router();

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// MENU ROUTES
// Get all menu items
router.get('/menu', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new menu item
router.post('/menu', adminAuth, async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    console.log('Created menu item:', item.name);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update menu item (FIXED: Handles isOutOfStock properly)
router.put('/menu/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // FIXED: Ensure isOutOfStock field is properly updated
    const updatedItem = await MenuItem.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    console.log(`Menu item ${updatedItem.name} updated:`, {
      stock: updatedItem.stock,
      isOutOfStock: updatedItem.isOutOfStock
    });
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete menu item
router.delete('/menu/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await MenuItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    console.log('Deleted menu item:', deletedItem.name);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ORDER ROUTES
// Get all orders (with optional status filter)
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status 
      ? { status } 
      : { status: { $in: ["Pending", "Preparing", "Ready"] } };
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('items.menuItemId', 'name price category');
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ["Pending", "Preparing", "Ready", "Collected", "Cancelled"];
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
    console.log(`Order ${id} status updated to ${status}`);
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
});

// REPORTS
// Daily report
router.get('/report/daily', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const orders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $ne: 'Cancelled' }
    });
    
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Calculate top-selling items
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
    console.error('Error generating daily report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sales report for date range
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
      status: { $ne: 'Cancelled' }
    });
    
    const totalOrders = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Calculate top-selling items
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
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
