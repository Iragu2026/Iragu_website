import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import RazorpayWebhookEvent from "../models/razorpayWebhookEventModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import { validateAndNormalizeAddressFromPinCode } from "../utils/indiaPincode.js";
import { queueAdminOrderNotification } from "../utils/orderNotification.js";
import {
    releaseInventoryForOrderItems,
    reserveInventoryForOrderItems,
} from "../utils/inventory.js";

const SHIPPING_FLAT = 100;
const GIFT_WRAP_FLAT = 50;

const roundToTwo = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const ensureRazorpayConfig = () => {
    if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_SECRET_KEY) {
        throw new HandleError("Razorpay keys are not configured on the server", 500);
    }
};

const getRazorpayClient = () => {
    ensureRazorpayConfig();
    return new Razorpay({
        key_id: process.env.RAZORPAY_API_KEY,
        key_secret: process.env.RAZORPAY_SECRET_KEY,
    });
};

const getSafeImageUrl = (rawItem, product) => {
    if (rawItem?.image && typeof rawItem.image === "string") return rawItem.image;
    if (Array.isArray(product.images) && product.images[0]?.url) return product.images[0].url;
    return "/images/new_arrival1.png";
};

const getSafeName = (rawItem, product) => {
    if (rawItem?.name && typeof rawItem.name === "string") return rawItem.name;
    return product.name;
};

const buildOrderFromItems = async (rawOrderItems = [], options = {}) => {
    if (!Array.isArray(rawOrderItems) || rawOrderItems.length === 0) {
        throw new HandleError("Cart is empty. Please add items before checkout", 400);
    }

    const productIds = [
        ...new Set(
            rawOrderItems
                .map((item) => String(item?.product || "").trim())
                .filter(Boolean)
        ),
    ];

    const products = await Product.find({ _id: { $in: productIds } })
        .select("name price stock images sizes sizePieces colors colorImages");
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const normalizedOrderItems = rawOrderItems.map((item) => {
        const productId = String(item?.product || "").trim();
        const quantity = Number(item?.quantity);

        if (!productId) {
            throw new HandleError("Invalid product in order items", 400);
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new HandleError("Each order item must have a valid quantity", 400);
        }

        const product = productMap.get(productId);
        if (!product) {
            throw new HandleError("One or more products are unavailable", 404);
        }
        if (quantity > Number(product.stock || 0)) {
            throw new HandleError(`Insufficient stock for ${product.name}`, 400);
        }

        const requestedSize = String(item?.size || "").trim();
        const availableSizes = Array.isArray(product.sizes)
            ? product.sizes
                .map((size) => String(size || "").trim())
                .filter(Boolean)
            : [];
        const availableSizePieces = Array.isArray(product.sizePieces)
            ? product.sizePieces
                .map((entry) => String(entry?.size || "").trim())
                .filter(Boolean)
            : [];
        const selectableSizes = availableSizes.length > 0
            ? availableSizes
            : availableSizePieces;
        let normalizedSize = "";
        if (selectableSizes.length > 0) {
            if (!requestedSize) {
                throw new HandleError(`Please select size for ${product.name}`, 400);
            }
            const matchedSize = selectableSizes.find(
                (size) => size.toLowerCase() === requestedSize.toLowerCase()
            );
            if (!matchedSize) {
                throw new HandleError(`Invalid size selected for ${product.name}`, 400);
            }
            normalizedSize = matchedSize;

            const sizePiecesEntry = Array.isArray(product.sizePieces)
                ? product.sizePieces.find(
                    (entry) =>
                        String(entry?.size || "").trim().toLowerCase() ===
                        matchedSize.toLowerCase()
                )
                : null;
            if (
                sizePiecesEntry &&
                quantity > Number(sizePiecesEntry.pieces || 0)
            ) {
                throw new HandleError(
                    `Insufficient stock for size ${matchedSize} in ${product.name}`,
                    400
                );
            }
        } else if (requestedSize) {
            normalizedSize = requestedSize;
        }

        const colorNamesFromColors = Array.isArray(product.colors)
            ? product.colors
                .map((entry) => String(entry?.name || "").trim())
                .filter(Boolean)
            : [];
        const colorNamesFromColorImages = Array.isArray(product.colorImages)
            ? product.colorImages
                .map((entry) => String(entry?.colorName || "").trim())
                .filter(Boolean)
            : [];
        const availableColors = Array.from(
            new Set([...colorNamesFromColors, ...colorNamesFromColorImages])
        );
        const requestedColor = String(item?.color || "").trim();
        let normalizedColor = "";
        if (availableColors.length > 0) {
            if (!requestedColor) {
                throw new HandleError(`Please select colour for ${product.name}`, 400);
            }
            const matchedColor = availableColors.find(
                (color) => color.toLowerCase() === requestedColor.toLowerCase()
            );
            if (!matchedColor) {
                throw new HandleError(`Invalid colour selected for ${product.name}`, 400);
            }
            normalizedColor = matchedColor;
        } else if (requestedColor) {
            normalizedColor = requestedColor;
        }

        return {
            name: getSafeName(item, product),
            price: Number(product.price),
            quantity,
            size: normalizedSize,
            color: normalizedColor,
            image: getSafeImageUrl(item, product),
            product: product._id,
        };
    });

    const itemsPrice = roundToTwo(
        normalizedOrderItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
    );
    const shippingPrice = normalizedOrderItems.length > 0 ? SHIPPING_FLAT : 0;
    const wrappedUnits = rawOrderItems.reduce((sum, item) => {
        if (!Boolean(item?.giftWrap)) return sum;
        const qty = Number(item?.quantity || 0);
        return sum + (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }, 0);
    // Backward compatible fallback: if legacy boolean flag is provided without per-item wrap flags.
    const giftWrapPrice = wrappedUnits > 0
        ? wrappedUnits * GIFT_WRAP_FLAT
        : (Boolean(options?.giftWrap) ? GIFT_WRAP_FLAT : 0);
    const totalPrice = roundToTwo(itemsPrice + shippingPrice + giftWrapPrice);

    return {
        normalizedOrderItems,
        pricing: {
            itemsPrice,
            shippingPrice,
            giftWrapPrice,
            totalPrice,
        },
    };
};

const validateShippingInfo = (shippingInfo = {}) => {
    const required = ["address", "country", "pinCode", "phoneNo"];
    for (const key of required) {
        if (
            shippingInfo[key] === undefined ||
            shippingInfo[key] === null ||
            String(shippingInfo[key]).trim() === ""
        ) {
            throw new HandleError(`Missing shipping field: ${key}`, 400);
        }
    }
};

const createReceipt = (userId) => `rcpt_${String(userId).slice(-6)}_${Date.now()}`.slice(0, 40);

const getWebhookBodyString = (req) => {
    if (Buffer.isBuffer(req.body)) {
        return req.body.toString("utf8");
    }
    if (typeof req.body === "string") {
        return req.body;
    }
    return "";
};

const extractWebhookEntity = (payload, key) => payload?.payload?.[key]?.entity || null;

const buildWebhookDedupeKey = ({ payloadString, payload }) => {
    const payloadEventId = String(payload?.id || "").trim();
    if (payloadEventId) return `event:${payloadEventId}`;
    return `hash:${crypto.createHash("sha256").update(payloadString).digest("hex")}`;
};

const findOrderByPaymentContext = async ({ paymentId, razorpayOrderId }) => {
    const normalizedPaymentId = String(paymentId || "").trim();
    const normalizedRazorpayOrderId = String(razorpayOrderId || "").trim();

    if (normalizedPaymentId) {
        const orderByPayment = await Order.findOne({ "paymentInfo.id": normalizedPaymentId });
        if (orderByPayment) return orderByPayment;
    }
    if (normalizedRazorpayOrderId) {
        const orderByRazorpayOrderId = await Order.findOne({
            "paymentInfo.razorpayOrderId": normalizedRazorpayOrderId,
        });
        if (orderByRazorpayOrderId) return orderByRazorpayOrderId;
    }
    return null;
};

export const razorpayWebhookHandler = handleAsyncError(async (req, res, next) => {
    const webhookSecret = String(process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
    if (!webhookSecret) {
        return next(new HandleError("Razorpay webhook secret is not configured", 500));
    }

    const signature = String(req.headers["x-razorpay-signature"] || "").trim();
    if (!signature) {
        return next(new HandleError("Missing Razorpay webhook signature", 400));
    }

    const payloadString = getWebhookBodyString(req);
    if (!payloadString) {
        return next(new HandleError("Invalid webhook payload", 400));
    }

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(payloadString)
        .digest("hex");

    if (expectedSignature !== signature) {
        return next(new HandleError("Invalid webhook signature", 400));
    }

    let payload;
    try {
        payload = JSON.parse(payloadString);
    } catch (error) {
        return next(new HandleError("Webhook payload must be valid JSON", 400));
    }

    const eventType = String(payload?.event || "").trim();
    if (!eventType) {
        return next(new HandleError("Webhook event type is missing", 400));
    }

    const paymentEntity =
        extractWebhookEntity(payload, "payment") ||
        extractWebhookEntity(payload, "order") ||
        extractWebhookEntity(payload, "refund");
    const paymentId = String(
        paymentEntity?.id || paymentEntity?.payment_id || ""
    ).trim();
    const razorpayOrderId = String(
        paymentEntity?.order_id || paymentEntity?.id || ""
    ).trim();

    const dedupeKey = buildWebhookDedupeKey({ payloadString, payload });

    try {
        await RazorpayWebhookEvent.create({
            dedupeKey,
            eventType,
            paymentId,
            razorpayOrderId,
            status: "processed",
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(200).json({ success: true, duplicate: true });
        }
        throw error;
    }

    let note = "Event acknowledged without action";
    let status = "ignored";

    try {
        if (eventType === "payment.captured" || eventType === "order.paid") {
            const order = await findOrderByPaymentContext({
                paymentId,
                razorpayOrderId,
            });
            if (order) {
                order.paymentInfo.status = "paid";
                if (paymentId) {
                    order.paymentInfo.id = paymentId;
                }
                if (razorpayOrderId && !order.paymentInfo.razorpayOrderId) {
                    order.paymentInfo.razorpayOrderId = razorpayOrderId;
                }
                await order.save({ validateBeforeSave: false });
                note = "Order marked as paid";
                status = "processed";
            } else {
                note = "No matching order found for captured payment";
            }
        } else if (eventType === "payment.failed") {
            const order = await findOrderByPaymentContext({
                paymentId,
                razorpayOrderId,
            });
            if (order) {
                const currentPaymentStatus = String(order.paymentInfo?.status || "").toLowerCase();
                if (currentPaymentStatus !== "paid") {
                    order.paymentInfo.status = "failed";
                }
                const currentOrderStatus = String(order.orderStatus || "").toLowerCase();
                if (order.inventoryReserved && !["delivered", "cancelled"].includes(currentOrderStatus)) {
                    await releaseInventoryForOrderItems(order.orderItems);
                    order.inventoryReserved = false;
                    order.orderStatus = "Cancelled";
                }
                await order.save({ validateBeforeSave: false });
                note = "Failed payment handled";
                status = "processed";
            } else {
                note = "No matching order found for failed payment";
            }
        } else if (eventType === "refund.created" || eventType === "refund.processed") {
            const refundEntity = extractWebhookEntity(payload, "refund");
            const refundPaymentId = String(refundEntity?.payment_id || paymentId || "").trim();
            const order = await findOrderByPaymentContext({ paymentId: refundPaymentId });
            if (order) {
                if (eventType === "refund.processed") {
                    order.paymentInfo.status = "refunded";
                } else if (String(order.paymentInfo?.status || "").toLowerCase() !== "refunded") {
                    order.paymentInfo.status = "refund_initiated";
                }
                await order.save({ validateBeforeSave: false });
                note = `${eventType} mapped to order`;
                status = "processed";
            } else {
                note = "No matching order found for refund event";
            }
        } else {
            note = `Unhandled event type: ${eventType}`;
        }
    } catch (error) {
        await RazorpayWebhookEvent.updateOne(
            { dedupeKey },
            {
                $set: {
                    status: "failed",
                    note: error.message,
                    processedAt: new Date(),
                },
            }
        );
        throw error;
    }

    await RazorpayWebhookEvent.updateOne(
        { dedupeKey },
        {
            $set: {
                status,
                note,
                processedAt: new Date(),
            },
        }
    );

    return res.status(200).json({ success: true });
});

export const createRazorpayOrder = handleAsyncError(async (req, res, next) => {
    const razorpay = getRazorpayClient();
    const { orderItems, giftWrap = false } = req.body;

    const { normalizedOrderItems, pricing } = await buildOrderFromItems(orderItems, { giftWrap });

    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(pricing.totalPrice) * 100),
        currency: "INR",
        receipt: createReceipt(req.user._id),
        notes: {
            userId: String(req.user._id),
            itemCount: String(normalizedOrderItems.length),
        },
    });

    res.status(200).json({
        success: true,
        key: process.env.RAZORPAY_API_KEY,
        razorpayOrder,
        pricing,
    });
});

export const verifyRazorpayPaymentAndCreateOrder = handleAsyncError(async (req, res, next) => {
    const razorpay = getRazorpayClient();

    const {
        shippingInfo,
        billingType = "same",
        billingInfo,
        orderItems,
        giftWrap = false,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    } = req.body;

    const finalRazorpayOrderId = razorpay_order_id || razorpayOrderId;
    const finalRazorpayPaymentId = razorpay_payment_id || razorpayPaymentId;
    const finalRazorpaySignature = razorpay_signature || razorpaySignature;

    if (!finalRazorpayOrderId || !finalRazorpayPaymentId || !finalRazorpaySignature) {
        return next(new HandleError("Missing Razorpay payment details", 400));
    }

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
        .update(`${finalRazorpayOrderId}|${finalRazorpayPaymentId}`)
        .digest("hex");

    if (generatedSignature !== finalRazorpaySignature) {
        return next(new HandleError("Payment verification failed. Invalid signature.", 400));
    }

    const existingOrder = await Order.findOne({ "paymentInfo.id": finalRazorpayPaymentId });
    if (existingOrder) {
        return res.status(200).json({
            success: true,
            message: "Order already created for this payment",
            order: existingOrder,
        });
    }

    validateShippingInfo(shippingInfo);
    const normalizedShippingInfo = await validateAndNormalizeAddressFromPinCode(shippingInfo, {
        requiredPinCode: true,
        label: "Shipping",
    });

    const requestedBillingInfo = billingType === "different" ? (billingInfo || {}) : normalizedShippingInfo;
    const hasBillingPinCode =
        requestedBillingInfo?.pinCode !== undefined &&
        requestedBillingInfo?.pinCode !== null &&
        String(requestedBillingInfo?.pinCode).trim() !== "";

    const finalBillingInfo = billingType === "different"
        ? await validateAndNormalizeAddressFromPinCode(requestedBillingInfo, {
            requiredPinCode: hasBillingPinCode,
            label: "Billing",
        })
        : normalizedShippingInfo;

    const { normalizedOrderItems, pricing } = await buildOrderFromItems(orderItems, { giftWrap });

    let paymentDetails = null;
    try {
        paymentDetails = await razorpay.payments.fetch(finalRazorpayPaymentId);
    } catch (error) {
        return next(new HandleError("Unable to verify payment with Razorpay", 400));
    }

    const razorpayStatus = String(paymentDetails?.status || "").toLowerCase();
    if (!["captured", "authorized"].includes(razorpayStatus)) {
        return next(new HandleError("Payment is not successful. Please try again.", 400));
    }

    const paymentMethod = paymentDetails?.method
        ? `Razorpay (${String(paymentDetails.method).toUpperCase()})`
        : "Razorpay";

    const reservedOrderItems = await reserveInventoryForOrderItems(normalizedOrderItems);

    let order;
    try {
        order = await Order.create({
            shippingInfo: normalizedShippingInfo,
            billingType,
            billingInfo: finalBillingInfo,
            orderItems: reservedOrderItems,
            paymentInfo: {
                id: finalRazorpayPaymentId,
                status: "paid",
                provider: "razorpay",
                method: paymentMethod,
                razorpayOrderId: finalRazorpayOrderId,
                razorpaySignature: finalRazorpaySignature,
            },
            itemsPrice: pricing.itemsPrice,
            shippingPrice: pricing.shippingPrice,
            giftWrapPrice: pricing.giftWrapPrice,
            totalPrice: pricing.totalPrice,
            paidAt: Date.now(),
            user: req.user._id,
            orderStatus: "Processing",
            inventoryReserved: true,
        });
    } catch (error) {
        await releaseInventoryForOrderItems(reservedOrderItems);
        throw error;
    }

    res.status(201).json({
        success: true,
        message: "Payment verified and order created successfully",
        order,
    });

    queueAdminOrderNotification({ order, customer: req.user });
});
