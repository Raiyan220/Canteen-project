// backend/controllers/authController.js (NEW FILE)
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: "User already exists with this email or username" 
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: "customer"
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.isLocked) {
      return res.status(423).json({ 
        error: "Account temporarily locked due to too many failed login attempts" 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.loginAttempts > 0) {
      await user.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { lastLogin: new Date() }
      });
    } else {
      await user.updateOne({ lastLogin: new Date() });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const createStaffAccount = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const createdBy = req.user.userId;

    if (role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        error: "Only super administrators can create admin accounts" 
      });
    }

    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Insufficient permissions to create staff accounts" 
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'staff',
      createdBy,
      isActive: true
    });

    res.status(201).json({
      message: `${role || 'Staff'} account created successfully`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdBy: user.createdBy
      }
    });
  } catch (error) {
    console.error("Staff creation error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('createdBy', 'username email');
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
};
