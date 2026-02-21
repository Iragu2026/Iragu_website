import Order from "../models/orderModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import Product from "../models/productModel.js";
import { validateAndNormalizeAddressFromPinCode } from "../utils/indiaPincode.js";
import { sendAdminOrderNotification } from "../utils/orderNotification.js";

// 1. Creating an Order
export const createNewOrder = handleAsyncError(async (req, res, next) => {
    const { shippingInfo, billingType, billingInfo, orderItems, paymentInfo, itemsPrice, shippingPrice, totalPrice } = req.body;

    if (!shippingInfo?.address || !shippingInfo?.phoneNo) {
        return next(new HandleError("Shipping address and phone number are required", 400));
    }

    const normalizedShippingInfo = await validateAndNormalizeAddressFromPinCode(shippingInfo, {
        requiredPinCode: true,
        label: "Shipping",
    });

    const requestedBillingInfo = billingType === "different" ? (billingInfo || {}) : normalizedShippingInfo;
    const hasBillingPinCode =
        requestedBillingInfo?.pinCode !== undefined &&
        requestedBillingInfo?.pinCode !== null &&
        String(requestedBillingInfo?.pinCode).trim() !== "";

    const normalizedBillingInfo = billingType === "different"
        ? await validateAndNormalizeAddressFromPinCode(requestedBillingInfo, {
            requiredPinCode: hasBillingPinCode,
            label: "Billing",
        })
        : normalizedShippingInfo;

    // No Razorpay yet: allow a safe demo paymentInfo and keep order as Processing
    const safePaymentInfo = {
        id: paymentInfo?.id || `demo_payment_${Date.now()}`,
        status: paymentInfo?.status || "processing",
    };

    const order = await Order.create({
        shippingInfo: normalizedShippingInfo,
        billingType: billingType || "same",
        billingInfo: normalizedBillingInfo,
        orderItems,
        paymentInfo: safePaymentInfo,
        itemsPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
        orderStatus: "Processing",
    });

    try {
        await sendAdminOrderNotification({ order, customer: req.user });
    } catch (error) {
        console.warn("Admin order notification failed:", error.message);
    }

    res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: order
    });
});


// 2. Get Single Order
export const getSingleOrder = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if(!order) {
        return next(new HandleError("Order not found", 404));
    }
    res.status(200).json({
        success: true,
        message: "Order details",
        order: order
    });
});

// 2b. Get Single Order (current user) — user can view only their own orders
export const getMySingleOrder = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if(!order) {
        return next(new HandleError("Order not found", 404));
    }
    const isOwner = order.user?.toString() === req.user._id?.toString();
    const isAdmin = req.user?.role === "admin";
    if(!isOwner && !isAdmin) {
        return next(new HandleError("You are not authorized to view this order", 403));
    }
    res.status(200).json({
        success: true,
        order: order
    });
});

// 3. Get All my Orders
export const getAllMyOrders = handleAsyncError(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    if(!orders) {
        return next(new HandleError("No orders found", 404));
    }
    res.status(200).json({
        success: true,
        message: "All my orders",
        orders: orders
    });
});

// 4. Get All Orders
export const getAllOrders = handleAsyncError(async (req, res, next) => {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    let totalAmount = 0;
    orders.forEach(order => {
        totalAmount += order.totalPrice;
    });
    res.status(200).json({
        success: true,
        message: "All orders",
        orders: orders,
        totalAmount: totalAmount
    });
});

// 5. Update Order Status
export const updateOrderStatus = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if(!order) {
        return next(new HandleError("Order not found", 404));
    }
    if(order.orderStatus === "Delivered") {
        return next(new HandleError("Order is already delivered", 400));
    }

    const nextStatus = String(req.body?.orderStatus || "").trim();
    if (!nextStatus) {
        return next(new HandleError("Order status is required", 400));
    }

    const normalizedNextStatus = nextStatus.toLowerCase();
    const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(normalizedNextStatus)) {
        return next(new HandleError("Invalid order status", 400));
    }

    const shouldDeductStock =
        normalizedNextStatus === "delivered" &&
        String(order.orderStatus || "").toLowerCase() !== "delivered";

    if (shouldDeductStock) {
        await Promise.all(
            order.orderItems.map(async (orderItem) =>
                updateQuantity(orderItem.product, orderItem.quantity)
            )
        );
    }

    order.orderStatus = nextStatus;
    if(normalizedNextStatus === "delivered") {
        order.deliveredAt = Date.now();
    }
    await order.save({validateBeforeSave: false});
    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order: order
    });
});

async function updateQuantity(productId, quantity) {
    const product = await Product.findById(productId);
    if(!product) {
        throw new HandleError("Product not found", 404);
    }
    product.stock = Math.max(0, Number(product.stock || 0) - Number(quantity || 0));
    await product.save({validateBeforeSave: false});
}

// 6. Delete Order
export const deleteOrder = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if(!order) {
        return next(new HandleError("Order not found", 404));
    }
    if(order.orderStatus !== "Delivered") {
        return next(new HandleError("This order is under process cannot be deleted", 400));
    }
    await order.deleteOne({_id: req.params.id});
    res.status(200).json({
        success: true,
        message: "Order deleted successfully",
    });
});
