import validator from "validator";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import Order from "../models/orderModel.js";
import ExchangeRequest, {
    EXCHANGE_REQUEST_STATUSES,
} from "../models/exchangeRequestModel.js";
import { sendEmail } from "../utils/sendEmail.js";

const EXCHANGE_WINDOW_DAYS = 3;
const EXCHANGE_WINDOW_MS = EXCHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const normalizeText = (value) => String(value || "").trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();
const normalizeMobile = (value) => String(value || "").replace(/\D/g, "");

const getExchangeDeadlineFromOrder = (order) => {
    const deliveredAtTime = new Date(order?.deliveredAt || 0).getTime();
    if (!Number.isFinite(deliveredAtTime) || deliveredAtTime <= 0) {
        return null;
    }
    return new Date(deliveredAtTime + EXCHANGE_WINDOW_MS);
};

const ensureOrderExchangeEligibility = (order) => {
    if (!order) {
        throw new HandleError("Order not found", 404);
    }

    const normalizedStatus = String(order.orderStatus || "").toLowerCase();
    if (normalizedStatus !== "delivered") {
        throw new HandleError("Exchange can be requested only after delivery", 400);
    }

    const deadline = getExchangeDeadlineFromOrder(order);
    if (!deadline) {
        throw new HandleError("Exchange is unavailable for this order", 400);
    }

    if (Date.now() > deadline.getTime()) {
        throw new HandleError(
            `Exchange window is closed. Exchange can be requested only within ${EXCHANGE_WINDOW_DAYS} days of delivery.`,
            400
        );
    }

    return deadline;
};

const buildAdminExchangeEmailMessage = ({ exchangeRequest, order }) => {
    const orderCode = String(order?._id || "").slice(-8).toUpperCase();
    return [
        "A new exchange request has been submitted.",
        "",
        `Order: #${orderCode}`,
        `Customer name: ${exchangeRequest.name}`,
        `Customer email: ${exchangeRequest.email}`,
        `Mobile: ${exchangeRequest.mobileNumber}`,
        `Address: ${exchangeRequest.address}`,
        "",
        "Reason:",
        exchangeRequest.reason,
    ].join("\n");
};

const notifyAdminAboutExchangeRequest = async ({ exchangeRequest, order }) => {
    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || process.env.SMTP_USER);
    if (!adminEmail || !validator.isEmail(adminEmail)) {
        return;
    }

    try {
        await sendEmail({
            email: adminEmail,
            subject: "New Exchange Request",
            message: buildAdminExchangeEmailMessage({ exchangeRequest, order }),
        });
    } catch (error) {
        console.warn("Exchange email notification failed:", error.message);
    }
};

const queueAdminExchangeNotification = ({ exchangeRequest, order }) => {
    if (!exchangeRequest || !order) return;
    const orderCode = String(order?._id || "").slice(-8).toUpperCase();
    void notifyAdminAboutExchangeRequest({ exchangeRequest, order })
        .then(() => {
            console.log(`Admin exchange notification sent for order #${orderCode}`);
        })
        .catch((error) => {
            const errorCode = error?.code ? ` (${error.code})` : "";
            console.warn(`Admin exchange notification failed${errorCode}:`, error?.message || error);
        });
};

export const createExchangeRequest = handleAsyncError(async (req, res, next) => {
    const orderId = normalizeText(req.params?.orderId);
    const name = normalizeText(req.body?.name);
    const email = normalizeEmail(req.body?.email);
    const address = normalizeText(req.body?.address);
    const reason = normalizeText(req.body?.reason);
    const mobileNumber = normalizeMobile(req.body?.mobileNumber);

    if (!orderId) {
        return next(new HandleError("Order id is required", 400));
    }
    if (!name || !email || !address || !reason || !mobileNumber) {
        return next(new HandleError("All exchange form fields are required", 400));
    }
    if (!validator.isEmail(email)) {
        return next(new HandleError("Please enter a valid email address", 400));
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
        return next(new HandleError("Mobile number must be a valid 10-digit number", 400));
    }
    if (reason.length < 10) {
        return next(new HandleError("Please provide at least 10 characters for exchange reason", 400));
    }

    const order = await Order.findById(orderId).select("user orderStatus deliveredAt");
    if (!order) {
        return next(new HandleError("Order not found", 404));
    }
    if (String(order.user) !== String(req.user._id)) {
        return next(new HandleError("You are not authorized to request exchange for this order", 403));
    }

    ensureOrderExchangeEligibility(order);

    const existingExchangeRequest = await ExchangeRequest.findOne({ order: order._id });
    if (existingExchangeRequest) {
        return next(new HandleError("Exchange request is already submitted for this order", 400));
    }

    const exchangeRequest = await ExchangeRequest.create({
        order: order._id,
        user: req.user._id,
        name,
        email,
        mobileNumber,
        address,
        reason,
    });

    res.status(201).json({
        success: true,
        message: "Exchange request submitted successfully",
        exchangeRequest,
    });

    queueAdminExchangeNotification({ exchangeRequest, order });
});

export const getMyExchangeByOrder = handleAsyncError(async (req, res, next) => {
    const orderId = normalizeText(req.params?.orderId);
    if (!orderId) {
        return next(new HandleError("Order id is required", 400));
    }

    const order = await Order.findById(orderId).select("user");
    if (!order) {
        return next(new HandleError("Order not found", 404));
    }
    if (String(order.user) !== String(req.user._id)) {
        return next(new HandleError("You are not authorized to view this order exchange", 403));
    }

    const exchangeRequest = await ExchangeRequest.findOne({
        order: order._id,
        user: req.user._id,
    });

    return res.status(200).json({
        success: true,
        exchangeRequest: exchangeRequest || null,
    });
});

export const getAllExchangeRequests = handleAsyncError(async (req, res) => {
    const exchangeRequests = await ExchangeRequest.find()
        .populate("user", "name email")
        .populate("order", "_id orderStatus deliveredAt totalPrice")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        exchangeRequests,
    });
});

export const updateExchangeRequestStatus = handleAsyncError(async (req, res, next) => {
    const requestId = normalizeText(req.params?.id);
    const nextStatus = normalizeText(req.body?.status);
    const allowedStatuses = EXCHANGE_REQUEST_STATUSES.filter((status) => status !== "Pending");

    if (!requestId) {
        return next(new HandleError("Exchange request id is required", 400));
    }
    if (!allowedStatuses.includes(nextStatus)) {
        return next(
            new HandleError(
                "Invalid exchange status. Allowed values are Exchange Accepted or Exchange Rejected.",
                400
            )
        );
    }

    const exchangeRequest = await ExchangeRequest.findById(requestId);
    if (!exchangeRequest) {
        return next(new HandleError("Exchange request not found", 404));
    }

    exchangeRequest.status = nextStatus;
    exchangeRequest.decisionAt = new Date();
    await exchangeRequest.save({ validateBeforeSave: false });

    const updatedRequest = await ExchangeRequest.findById(exchangeRequest._id)
        .populate("user", "name email")
        .populate("order", "_id orderStatus deliveredAt totalPrice");

    return res.status(200).json({
        success: true,
        message: "Exchange request status updated successfully",
        exchangeRequest: updatedRequest,
    });
});
