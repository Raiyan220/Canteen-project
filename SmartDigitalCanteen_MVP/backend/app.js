import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import guestRoutes from './routes/guestRoutes.js'; // NEW

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/guest', guestRoutes); // NEW

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

export default app;
