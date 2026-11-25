import express from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'canteen-store.json');

const SEED_MENU = [
  {
    _id: 'menu_burger_01',
    name: 'Crispy Cheese Burger',
    description: 'Juicy seared beef patty with melted cheddar, crisp lettuce, and house crimson sauce.',
    price: 140,
    category: 'Lunch',
    imageUrl: '/images/burger.svg',
    prepTimeMinutes: 10,
    stock: 25,
    isOutOfStock: false,
    isSpecial: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'menu_pancake_02',
    name: 'Golden Honey Pancakes',
    description: 'Fluffy buttermilk pancake stack drizzled with warm honey butter.',
    price: 85,
    category: 'Breakfast',
    imageUrl: '/images/pancake.svg',
    prepTimeMinutes: 7,
    stock: 20,
    isOutOfStock: false,
    isSpecial: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'menu_tea_03',
    name: 'Spiced Iced Tea',
    description: 'Freshly brewed chilled black tea infused with lemon and mint.',
    price: 45,
    category: 'Drinks',
    imageUrl: '/images/tea.svg',
    prepTimeMinutes: 2,
    stock: -1,
    isOutOfStock: false,
    isSpecial: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'menu_fries_04',
    name: 'Peri-Peri Crispy Fries',
    description: 'Golden double-fried potato fries dusted with smoky crimson peri-peri seasoning.',
    price: 70,
    category: 'Snacks',
    imageUrl: '/images/fries.svg',
    prepTimeMinutes: 5,
    stock: 35,
    isOutOfStock: false,
    isSpecial: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'menu_wrap_05',
    name: 'Crimson Grilled Chicken Wrap',
    description: 'Char-grilled spiced chicken strips wrapped in warm flatbread with garlic sauce.',
    price: 165,
    category: 'Lunch',
    imageUrl: '/images/burger.svg',
    prepTimeMinutes: 9,
    stock: 18,
    isOutOfStock: false,
    isSpecial: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'menu_toast_06',
    name: 'Masala Omelette Toast',
    description: 'Spiced two-egg omelette with roasted tomatoes and toasted artisan bread.',
    price: 65,
    category: 'Breakfast',
    imageUrl: '/images/pancake.svg',
    prepTimeMinutes: 6,
    stock: 24,
    isOutOfStock: false,
    isSpecial: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'menu_cooler_07',
    name: 'Mint Lime Cooler',
    description: 'Sparkling chilled limeade muddled with fresh garden mint leaves.',
    price: 55,
    category: 'Drinks',
    imageUrl: '/images/tea.svg',
    prepTimeMinutes: 2,
    stock: -1,
    isOutOfStock: false,
    isSpecial: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'menu_nacho_08',
    name: 'Loaded Nacho Crunch Box',
    description: 'Crisp tortilla chips layered with warm cheese sauce and crimson salsa.',
    price: 110,
    category: 'Snacks',
    imageUrl: '/images/fries.svg',
    prepTimeMinutes: 5,
    stock: 15,
    isOutOfStock: false,
    isSpecial: false,
    createdAt: new Date().toISOString(),
  },
];

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'crimsonbite_dev_secret_key';
}

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return {
        menu: Array.isArray(parsed.menu) && parsed.menu.length ? parsed.menu : [...SEED_MENU],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        guests: Array.isArray(parsed.guests) ? parsed.guests : [],
      };
    }
  } catch {
    // Recreate clean state below
  }
  return {
    menu: [...SEED_MENU],
    orders: [],
    feedback: [],
    users: [],
    guests: [],
  };
}

const store = loadStore();

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch {
    // Non-fatal in read-only filesystems
  }
}

function decodeOptionalUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), getJwtSecret());
  } catch {
    return null;
  }
}

function requireFallbackAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  const expected = process.env.ADMIN_PASSWORD || 'demo_password';
  if (!adminKey || adminKey !== expected) {
    return res.status(403).json({ error: 'Unauthorized: invalid admin key' });
  }
  next();
}

const router = express.Router();

// MENU
router.get('/menu', (req, res) => {
  const { category, search, specials } = req.query;
  let items = [...store.menu];
  if (category && category !== 'All') {
    items = items.filter((m) => m.category === category);
  }
  if (specials === 'true') {
    items = items.filter((m) => m.isSpecial);
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter((m) =>
      `${m.name} ${m.description} ${m.category}`.toLowerCase().includes(q)
    );
  }
  res.json(items);
});

router.get('/menu/:id', (req, res) => {
  const found = store.menu.find((m) => m._id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Menu item not found' });
  res.json(found);
});

// ORDERS
router.post('/orders', (req, res) => {
  const user = decodeOptionalUser(req);
  const { customerName, items, notes, pickupSlot } = req.body || {};

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Order items required' });
  }

  let total = 0;
  let maxPrep = 5;
  const orderItems = [];

  for (const reqItem of items) {
    const dish = store.menu.find((m) => m._id === reqItem.menuItemId);
    if (!dish) {
      return res.status(404).json({ error: `Menu item not found: ${reqItem.menuItemId}` });
    }
    const qty = Math.max(1, parseInt(reqItem.qty || 1, 10));
    if (dish.isOutOfStock || (dish.stock >= 0 && dish.stock < qty)) {
      return res.status(400).json({ error: `${dish.name} is out of stock` });
    }
    total += Number(dish.price) * qty;
    maxPrep = Math.max(maxPrep, Number(dish.prepTimeMinutes || 5));
    orderItems.push({
      menuItemId: dish._id,
      name: dish.name,
      price: Number(dish.price),
      qty,
    });
  }

  for (const it of orderItems) {
    const dish = store.menu.find((m) => m._id === it.menuItemId);
    if (dish && dish.stock >= 0) {
      dish.stock = Math.max(0, dish.stock - it.qty);
      if (dish.stock === 0) dish.isOutOfStock = true;
    }
  }

  const now = new Date();
  const order = {
    _id: makeId('ord'),
    customerName: user ? user.username : String(customerName || 'Guest').trim() || 'Guest',
    userId: user ? user.userId : null,
    items: orderItems,
    total,
    notes: String(notes || '').slice(0, 240),
    pickupSlot: String(pickupSlot || 'ASAP'),
    status: 'Pending',
    placedAt: now.toISOString(),
    estimatedReadyAt: new Date(now.getTime() + maxPrep * 60000).toISOString(),
    cancelledAt: null,
    collectedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  store.orders.unshift(order);
  saveStore();
  res.status(201).json(order);
});

router.get('/orders/active', (req, res) => {
  res.json(
    store.orders.filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status))
  );
});

router.get('/orders', (req, res) => {
  const user = decodeOptionalUser(req);
  if (user) {
    return res.json(store.orders.filter((o) => o.userId === user.userId));
  }
  const { customerName } = req.query;
  if (!customerName) {
    return res.status(400).json({ error: 'customerName is required for guest users' });
  }
  res.json(
    store.orders.filter(
      (o) => o.customerName.toLowerCase() === String(customerName).trim().toLowerCase()
    )
  );
});

router.get('/orders/:id', (req, res) => {
  const order = store.orders.find((o) => o._id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.patch('/orders/:id/cancel', (req, res) => {
  const order = store.orders.find((o) => o._id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'Pending') {
    return res.status(400).json({ error: 'Cannot cancel once kitchen preparation has started' });
  }
  order.status = 'Cancelled';
  order.cancelledAt = new Date().toISOString();
  order.updatedAt = order.cancelledAt;

  for (const it of order.items) {
    const dish = store.menu.find((m) => m._id === it.menuItemId);
    if (dish && dish.stock >= 0) {
      dish.stock += it.qty;
      if (dish.stock > 0) dish.isOutOfStock = false;
    }
  }
  saveStore();
  res.json(order);
});

// FEEDBACK
router.post('/feedback', (req, res) => {
  const { orderId, rating, comment } = req.body || {};
  if (!orderId || !rating) {
    return res.status(400).json({ error: 'orderId and rating required' });
  }
  const existing = store.feedback.find((f) => f.orderId === orderId);
  if (existing) {
    existing.rating = Number(rating);
    existing.comment = String(comment || '');
    existing.updatedAt = new Date().toISOString();
    saveStore();
    return res.json(existing);
  }
  const fb = {
    _id: makeId('fb'),
    orderId,
    rating: Number(rating),
    comment: String(comment || ''),
    createdAt: new Date().toISOString(),
  };
  store.feedback.unshift(fb);
  saveStore();
  res.status(201).json(fb);
});

router.get('/feedback', (req, res) => {
  const { orderId } = req.query;
  const list = orderId ? store.feedback.filter((f) => f.orderId === orderId) : store.feedback;
  res.json(list);
});

// AUTH
router.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password required' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (store.users.some((u) => u.email === normalizedEmail)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    _id: makeId('usr'),
    username: String(username).trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };
  store.users.push(newUser);
  saveStore();

  const token = jwt.sign(
    { userId: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
  res.status(201).json({
    token,
    user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
  });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = store.users.find((u) => u.email === normalizedEmail);
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { userId: user._id, username: user.username, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email, role: user.role },
  });
});

router.get('/auth/profile', (req, res) => {
  const decoded = decodeOptionalUser(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const user = store.users.find((u) => u._id === decoded.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    user: { id: user._id, username: user.username, email: user.email, role: user.role },
  });
});

router.post('/auth/logout', (req, res) => {
  res.json({ ok: true });
});

// GUEST
router.post('/guest/create', (req, res) => {
  const { guestId, displayName } = req.body || {};
  const id = guestId || makeId('guest');
  let guest = store.guests.find((g) => g.guestId === id);
  if (!guest) {
    guest = {
      guestId: id,
      displayName: displayName || '',
      preferences: { favoriteItems: [], dietaryNotes: '' },
      orders: [],
    };
    store.guests.push(guest);
    saveStore();
  }
  res.json(guest);
});

router.put('/guest/preferences/:guestId', (req, res) => {
  const { guestId } = req.params;
  let guest = store.guests.find((g) => g.guestId === guestId);
  if (!guest) {
    guest = { guestId, displayName: '', preferences: { favoriteItems: [] }, orders: [] };
    store.guests.push(guest);
  }
  guest.preferences = { ...guest.preferences, ...(req.body?.preferences || {}) };
  saveStore();
  res.json(guest);
});

router.post('/guest/track-order', (req, res) => {
  const { guestId, orderId, orderData } = req.body || {};
  const guest = store.guests.find((g) => g.guestId === guestId);
  if (guest && orderId) {
    guest.orders = [{ orderId, ...(orderData || {}) }, ...guest.orders.filter((o) => o.orderId !== orderId)];
    saveStore();
  }
  res.json({ ok: true });
});

router.post('/guest/upgrade', async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  if (store.users.some((u) => u.email === normalizedEmail)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    _id: makeId('usr'),
    username: String(username).trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };
  store.users.push(newUser);
  saveStore();
  const token = jwt.sign(
    { userId: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
  res.status(201).json({
    token,
    user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
  });
});

// ADMIN
router.post('/admin/verify', requireFallbackAdmin, (req, res) => {
  res.json({ ok: true });
});

router.get('/admin/menu', (req, res) => {
  res.json([...store.menu]);
});

router.post('/admin/menu', requireFallbackAdmin, (req, res) => {
  const body = req.body || {};
  const stock = body.stock != null ? parseInt(body.stock, 10) : -1;
  const item = {
    _id: makeId('menu'),
    name: String(body.name || 'New Dish'),
    description: String(body.description || ''),
    price: Number(body.price || 0),
    category: body.category || 'Lunch',
    imageUrl: body.imageUrl || '/images/placeholder.svg',
    prepTimeMinutes: Number(body.prepTimeMinutes || 5),
    stock: Number.isNaN(stock) ? -1 : stock,
    isOutOfStock: stock === 0,
    isSpecial: Boolean(body.isSpecial),
    createdAt: new Date().toISOString(),
  };
  store.menu.unshift(item);
  saveStore();
  res.status(201).json(item);
});

router.put('/admin/menu/:id', requireFallbackAdmin, (req, res) => {
  const item = store.menu.find((m) => m._id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  const update = { ...req.body };
  if (update.stock != null) {
    const parsed = parseInt(update.stock, 10);
    update.stock = Number.isNaN(parsed) ? -1 : parsed;
    if (update.stock === 0) update.isOutOfStock = true;
    else if (update.stock > 0 && req.body.isOutOfStock === undefined) update.isOutOfStock = false;
  }
  Object.assign(item, update);
  saveStore();
  res.json(item);
});

router.delete('/admin/menu/:id', requireFallbackAdmin, (req, res) => {
  const idx = store.menu.findIndex((m) => m._id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Menu item not found' });
  store.menu.splice(idx, 1);
  saveStore();
  res.json({ message: 'Menu item deleted successfully' });
});

router.get('/admin/orders', requireFallbackAdmin, (req, res) => {
  const { status } = req.query;
  const list = status
    ? store.orders.filter((o) => o.status === status)
    : store.orders.filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status));
  res.json(list);
});

router.patch('/admin/orders/:id/status', requireFallbackAdmin, (req, res) => {
  const { status } = req.body || {};
  const valid = ['Pending', 'Preparing', 'Ready', 'Collected', 'Cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const order = store.orders.find((o) => o._id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = status;
  if (status === 'Collected') order.collectedAt = new Date().toISOString();
  if (status === 'Cancelled') order.cancelledAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();
  saveStore();
  res.json(order);
});

router.get('/admin/feedback', requireFallbackAdmin, (req, res) => {
  const populated = store.feedback.map((fb) => {
    const ord = store.orders.find((o) => o._id === fb.orderId);
    return {
      ...fb,
      orderId: ord
        ? { _id: ord._id, customerName: ord.customerName, total: ord.total, status: ord.status }
        : fb.orderId,
    };
  });
  res.json(populated);
});

function summarizeOrders(list) {
  const totalOrders = list.length;
  const revenue = list.reduce((s, o) => s + Number(o.total || 0), 0);
  const counts = new Map();
  list.forEach((o) => {
    (o.items || []).forEach((it) => counts.set(it.name, (counts.get(it.name) || 0) + it.qty));
  });
  const topSelling = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, qty]) => ({ name, qty }));
  return { totalOrders, revenue, topSelling };
}

router.get('/admin/report/daily', requireFallbackAdmin, (req, res) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todays = store.orders.filter(
    (o) => !['Cancelled', 'CANCELLED'].includes(o.status) && String(o.createdAt).slice(0, 10) === todayStr
  );
  res.json({ date: todayStr, ...summarizeOrders(todays) });
});

router.get('/admin/report/sales', requireFallbackAdmin, (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required' });
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  const filtered = store.orders.filter((o) => {
    if (['Cancelled', 'CANCELLED'].includes(o.status)) return false;
    const t = new Date(o.createdAt).getTime();
    return t >= startDate.getTime() && t <= endDate.getTime();
  });
  res.json({
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
    ...summarizeOrders(filtered),
  });
});

export default router;
