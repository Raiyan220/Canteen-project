import { Router } from "express";
import { requireAdmin } from "../utils/auth.js";
import { listActiveOrders, updateOrderStatus, reportDaily } from "../controllers/adminController.js";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "../controllers/menuController.js";

const router = Router();

router.get("/orders", requireAdmin, listActiveOrders);
router.patch("/orders/:id/status", requireAdmin, updateOrderStatus);
router.get("/report/daily", requireAdmin, reportDaily);


// Mirror menu CRUD under /api/admin/menu
router.post("/menu", requireAdmin, createMenuItem);
router.put("/menu/:id", requireAdmin, updateMenuItem);
router.delete("/menu/:id", requireAdmin, deleteMenuItem);

export default router;
