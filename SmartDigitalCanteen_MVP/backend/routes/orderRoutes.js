// backend/routes/orderRoutes.js (UPDATE - add optionalAuth to the GET route)
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
router.get("/:id", getOrder);
router.get("/", optionalAuth, listOrdersByCustomer); // ← ADD optionalAuth here
router.patch("/:id/cancel", cancelOrder);
router.get("/active", requireAdmin, listActiveOrders);
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
