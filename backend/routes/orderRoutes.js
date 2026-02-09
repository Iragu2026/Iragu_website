import express from "express";
import { createNewOrder, getSingleOrder, getAllMyOrders, getAllOrders, updateOrderStatus, deleteOrder } from "../controller/orederController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";


const router = express.Router();

router.route("/new/order").post(verifyUserAuth, createNewOrder);
router.route("/admin/order/:id").get(verifyUserAuth, roleBasedAccess("admin"), getSingleOrder);
router.route("/orders/user").get(verifyUserAuth, getAllMyOrders);
router.route("/admin/orders").get(verifyUserAuth, roleBasedAccess("admin"), getAllOrders);
router.route("/admin/order/:id").put(verifyUserAuth, roleBasedAccess("admin"), updateOrderStatus);
router.route("/admin/order/:id").delete(verifyUserAuth, roleBasedAccess("admin"), deleteOrder);

export default router;