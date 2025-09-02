import { Router } from "express"; 
import { requireAdmin } from "../utils/auth.js";
import {
  listActiveOrders,
  updateOrderStatus,
  reportDaily,
  reportSales, // New sales report endpoint
} from "../controllers/adminController.js";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";

const router = Router();

/**
 * ===========================
 * Orders Management Routes
 * ===========================
 */

// Get all active orders (Pending, Preparing, Ready)
router.get("/orders", requireAdmin, listActiveOrders);

// Update status of a specific order
// PATCH body: { status: "Pending"|"Preparing"|"Ready"|"Collected"|"Cancelled" }
router.patch("/orders/:id/status", requireAdmin, updateOrderStatus);

// Generate daily report: total orders, revenue, top-selling items
router.get("/report/daily", requireAdmin, reportDaily);

// Generate sales report for a custom date range
// Query params: start=YYYY-MM-DD, end=YYYY-MM-DD
router.get("/report/sales", requireAdmin, reportSales);

/**
 * ===========================
 * Menu Management Routes
 * ===========================
 */

// Admin can create a new menu item
router.post("/menu", requireAdmin, createMenuItem);

// Admin can update an existing menu item
router.put("/menu/:id", requireAdmin, updateMenuItem);

// Admin can delete a menu item
router.delete("/menu/:id", requireAdmin, deleteMenuItem);

export default router;
