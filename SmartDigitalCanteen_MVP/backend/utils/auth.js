// backend/utils/auth.js (UPDATED - keeping existing requireAdmin)
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// KEEP YOUR EXISTING FUNCTION UNCHANGED
export function requireAdmin(req, res, next) {
  const provided = req.header("x-admin-key");
  const expected = process.env.ADMIN_PASSWORD || "demo_password";
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized: invalid admin key" });
  }
  next();
}

// NEW JWT-based authentication (ADDITION)
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// NEW convenience middleware combinations (ADDITION)
export const requireAuth = authenticateToken;
export const requireJWTAdmin = [authenticateToken, requireRole(['admin', 'super_admin'])];
export const requireSuperAdmin = [authenticateToken, requireRole(['super_admin'])];
export const requireStaff = [authenticateToken, requireRole(['staff', 'admin', 'super_admin'])];

// OPTIONAL: Check if user is authenticated (for mixed routes)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
