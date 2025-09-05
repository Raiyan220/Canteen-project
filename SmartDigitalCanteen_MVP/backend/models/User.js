import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'staff', 'admin', 'super_admin'], default: 'customer' },
  
  // Enhanced profile with guest migration support
  profile: {
    phone: String,
    preferences: {
      favoriteItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        orderUpdates: { type: Boolean, default: true }
      }
    }
  },
  
  // Guest data migration tracking
  guestData: {
    originalGuestId: String,
    migratedAt: Date,
    orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    totalOrdersAsGuest: { type: Number, default: 0 },
    totalSpentAsGuest: { type: Number, default: 0 }
  },
  
  // Account management
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  
  // Security features (existing)
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Login attempts management
UserSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

export default mongoose.model('User', UserSchema);
