import mongoose from 'mongoose';

const GuestUserSchema = new mongoose.Schema({
  guestId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionData: {
    customerName: { type: String, default: 'Guest' },
    email: String,
    phone: String,
    preferences: {
      favoriteItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
      lastVisit: Date,
      orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
    }
  },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  upgradePrompts: {
    shown: { type: Number, default: 0 },
    lastShown: Date,
    dismissed: { type: Boolean, default: false }
  },
  conversionData: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 }
  }
});

export default mongoose.model('GuestUser', GuestUserSchema);
