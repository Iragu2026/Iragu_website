import Order from "../models/orderModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import Product from "../models/productModel.js";

// 1. Creating an Order
export const createNewOrder = handleAsyncError(async (req, res, next) => {
    const { shippingInfo, orderItems, paymentInfo, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;
    const order = await Order.create({ shippingInfo, orderItems, paymentInfo, itemsPrice, taxPrice, shippingPrice, totalPrice, paidAt: Date.now(), user: req.user._id });
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

// 3. Get All my Orders
export const getAllMyOrders = handleAsyncError(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id });
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
    const orders = await Order.find();
    let totalAmount = 0;
    orders.forEach(order => {
        totalAmount += order.totalPrice;
    });
    if(!orders || orders.length === 0) {
        return next(new HandleError("No orders found", 404));
    }
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
    await Promise.all(order.orderItems.map(async (orderItem) => updateQuantity(orderItem.product, orderItem.quantity)));
    order.orderStatus = req.body.orderStatus;
    if(req.body.orderStatus === "Delivered") {
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
        return next(new HandleError("Product not found", 404));
    }
    product.stock -= quantity;
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