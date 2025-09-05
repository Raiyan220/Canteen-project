// backend/routes/authRoutes.js (NEW FILE)
import { Router } from "express";
import { 
  register, 
  login, 
  createStaffAccount, 
  getProfile, 
  logout 
} from "../controllers/authController.js";
import { requireAuth, requireJWTAdmin, requireSuperAdmin } from "../utils/auth.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", requireAuth, getProfile);
router.post("/logout", requireAuth, logout);

// Admin routes (JWT-based)
router.post("/create-staff", requireJWTAdmin, createStaffAccount);

export default router;
