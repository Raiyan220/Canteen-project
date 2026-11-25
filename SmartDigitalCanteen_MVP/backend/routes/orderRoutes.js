import { Router } from "express";
import {
  createOrder,
  getOrder,
  listOrdersByCustomer,
  cancelOrder,
  listActiveOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import { requireAdmin, optionalAuth } from "../utils/auth.js";

const router = Router();

router.post("/", optionalAuth, createOrder);
router.get("/", optionalAuth, listOrdersByCustomer);
router.get("/active", requireAdmin, listActiveOrders);
router.get("/:id", getOrder);
router.patch("/:id/cancel", cancelOrder);
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
