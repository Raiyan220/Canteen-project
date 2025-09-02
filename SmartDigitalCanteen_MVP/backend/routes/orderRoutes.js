import { Router } from "express";
import { createOrder, getOrder, listOrdersByCustomer, cancelOrder } from "../controllers/orderController.js";

const router = Router();
router.post("/", createOrder);
router.get("/:id", getOrder);
router.get("/", listOrdersByCustomer);
router.patch("/:id/cancel", cancelOrder);

export default router;
