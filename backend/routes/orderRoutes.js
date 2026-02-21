import express from "express";
import { createNewOrder, getSingleOrder, getMySingleOrder, getAllMyOrders, getAllOrders, updateOrderStatus, deleteOrder } from "../controller/orederController.js";
import { createRazorpayOrder, verifyRazorpayPaymentAndCreateOrder } from "../controller/paymentController.js";
import {
    createExchangeRequest,
    getAllExchangeRequests,
    getMyExchangeByOrder,
    updateExchangeRequestStatus,
} from "../controller/exchangeController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";


const router = express.Router();

router.route("/new/order").post(verifyUserAuth, createNewOrder);
router.route("/payment/razorpay/order").post(verifyUserAuth, createRazorpayOrder);
router.route("/payment/razorpay/verify").post(verifyUserAuth, verifyRazorpayPaymentAndCreateOrder);
router.route("/order/:id").get(verifyUserAuth, getMySingleOrder);
router.route("/order/:orderId/exchange")
    .get(verifyUserAuth, getMyExchangeByOrder)
    .post(verifyUserAuth, createExchangeRequest);
router.route("/admin/order/:id").get(verifyUserAuth, roleBasedAccess("admin"), getSingleOrder);
router.route("/orders/user").get(verifyUserAuth, getAllMyOrders);
router.route("/admin/orders").get(verifyUserAuth, roleBasedAccess("admin"), getAllOrders);
router.route("/admin/exchanges").get(verifyUserAuth, roleBasedAccess("admin"), getAllExchangeRequests);
router.route("/admin/exchange/:id").put(verifyUserAuth, roleBasedAccess("admin"), updateExchangeRequestStatus);
router.route("/admin/order/:id").put(verifyUserAuth, roleBasedAccess("admin"), updateOrderStatus);
router.route("/admin/order/:id").delete(verifyUserAuth, roleBasedAccess("admin"), deleteOrder);

export default router;
