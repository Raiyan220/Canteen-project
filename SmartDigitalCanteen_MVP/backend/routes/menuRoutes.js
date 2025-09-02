import { Router } from "express";
import {
  listMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from "../controllers/menuController.js";
import { requireAdmin } from "../utils/auth.js";

const router = Router();

/**
 * Public Routes
 */

// GET all menu items (supports filters: category, search, specials)
router.get("/", listMenu);

// GET a single menu item by ID
router.get("/:id", getMenuItem);

/**
 * Admin Routes (password protected)
 */

// POST create new menu item
router.post("/", requireAdmin, createMenuItem);

// PUT update menu item by ID
router.put("/:id", requireAdmin, updateMenuItem);

// DELETE menu item by ID
router.delete("/:id", requireAdmin, deleteMenuItem);

export default router;
