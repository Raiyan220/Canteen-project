import { Router } from "express";
import {
  createOrder,
  getOrder,
  listOrdersByCustomer,
  cancelOrder,
  listActiveOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import { requireAdmin } from "../utils/auth.js";

const router = Router();

/**
 * @route POST /api/orders
 * @desc Create a new order
 * @access Public
 */
router.post("/", createOrder);

/**
 * @route GET /api/orders/:id
 * @desc Get a single order by ID
 * @access Public
 */
router.get("/:id", getOrder);

/**
 * @route GET /api/orders
 * @desc Get all orders by a customer
 * @access Public
 * @query customerName
 */
router.get("/", listOrdersByCustomer);

/**
 * @route PATCH /api/orders/:id/cancel
 * @desc Cancel an order if status is Pending
 * @access Public
 */
router.patch("/:id/cancel", cancelOrder);

// --- NEW ADMIN ROUTES ---

/**
 * @route GET /api/orders/active
 * @desc Get all active orders (Pending, Preparing, Ready)
 * @access Admin
 */
router.get("/active", requireAdmin, listActiveOrders);

/**
 * @route PATCH /api/orders/:id/status
 * @desc Update the status of an order (admin)
 * @access Admin
 */
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
