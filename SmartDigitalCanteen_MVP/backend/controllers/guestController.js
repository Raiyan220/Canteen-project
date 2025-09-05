import GuestUser from '../models/GuestUser.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import jwt from 'jsonwebtoken';

// Create or get guest user
export const getOrCreateGuest = async (req, res) => {
  try {
    const { guestId } = req.body;
    
    let guest = await GuestUser.findOne({ guestId });
    
    if (!guest) {
      guest = new GuestUser({
        guestId,
        sessionData: {
          customerName: req.body.customerName || 'Guest'
        }
      });
      await guest.save();
    } else {
      guest.lastActive = new Date();
      await guest.save();
    }
    
    res.json({
      success: true,
      guest: {
        guestId: guest.guestId,
        customerName: guest.sessionData.customerName,
        totalOrders: guest.conversionData.totalOrders,
        shouldShowUpgrade: shouldShowUpgradePrompt(guest)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update guest preferences
export const updateGuestPreferences = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { favorites, customerName, email, phone } = req.body;
    
    const guest = await GuestUser.findOne({ guestId });
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    if (favorites) guest.sessionData.preferences.favoriteItems = favorites;
    if (customerName) guest.sessionData.customerName = customerName;
    if (email) guest.sessionData.email = email;
    if (phone) guest.sessionData.phone = phone;
    
    guest.lastActive = new Date();
    await guest.save();
    
    res.json({ success: true, guest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Track guest order
export const trackGuestOrder = async (req, res) => {
  try {
    const { guestId, orderId, orderTotal } = req.body;
    
    const guest = await GuestUser.findOne({ guestId });
    if (guest) {
      guest.sessionData.preferences.orderHistory.push(orderId);
      guest.conversionData.totalOrders += 1;
      guest.conversionData.totalSpent += orderTotal;
      guest.conversionData.avgOrderValue = guest.conversionData.totalSpent / guest.conversionData.totalOrders;
      await guest.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upgrade guest to registered user
export const upgradeGuestToUser = async (req, res) => {
  try {
    const { guestId, email, password, username } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Get guest data
    const guest = await GuestUser.findOne({ guestId }).populate('sessionData.preferences.orderHistory');
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    // Create new user with guest data
    const newUser = new User({
      username: username || guest.sessionData.customerName,
      email,
      password,
      role: 'customer',
      profile: {
        phone: guest.sessionData.phone,
        preferences: {
          favoriteItems: guest.sessionData.preferences.favoriteItems
        }
      },
      guestData: {
        originalGuestId: guestId,
        migratedAt: new Date(),
        orderHistory: guest.sessionData.preferences.orderHistory,
        totalOrdersAsGuest: guest.conversionData.totalOrders,
        totalSpentAsGuest: guest.conversionData.totalSpent
      }
    });
    
    await newUser.save();
    
    // Update guest orders to link to new user
    await Order.updateMany(
      { _id: { $in: guest.sessionData.preferences.orderHistory } },
      { $set: { userId: newUser._id, upgradedFromGuest: true } }
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Clean up guest data
    await GuestUser.findByIdAndDelete(guest._id);
    
    res.json({
      success: true,
      message: 'Account created successfully! Your order history has been saved.',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        migratedOrders: guest.conversionData.totalOrders
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send upgrade incentive email
export const sendUpgradeIncentive = async (req, res) => {
  try {
    const { guestId } = req.params;
    
    const guest = await GuestUser.findOne({ guestId });
    if (!guest || !guest.sessionData.email) {
      return res.status(400).json({ error: 'Guest email required' });
    }
    
    // Update upgrade prompt tracking
    guest.upgradePrompts.shown += 1;
    guest.upgradePrompts.lastShown = new Date();
    await guest.save();
    
    // Here you would integrate with your email service
    // For now, just return success
    res.json({
      success: true,
      message: 'Upgrade incentive sent',
      benefits: [
        'Save your favorites across devices',
        'Faster checkout on future orders',
        'Exclusive member discounts',
        'Order history and tracking',
        'Priority customer support'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to determine if upgrade prompt should show
const shouldShowUpgradePrompt = (guest) => {
  if (guest.upgradePrompts.dismissed) return false;
  if (guest.upgradePrompts.shown >= 3) return false; // Max 3 prompts
  if (guest.conversionData.totalOrders >= 2) return true;
  if (guest.sessionData.preferences.favoriteItems.length >= 3) return true;
  return false;
};
