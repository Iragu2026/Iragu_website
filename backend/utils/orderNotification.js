import validator from "validator";
import { sendEmail } from "./sendEmail.js";

const normalizeText = (value) => String(value || "").trim();

const getAdminOrderEmail = () => {
    const email = normalizeText(process.env.ADMIN_EMAIL || process.env.SMTP_USER).toLowerCase();
    if (!email || !validator.isEmail(email)) {
        return "";
    }
    return email;
};

const formatMoney = (value) => Number(value || 0).toLocaleString("en-IN");

const formatAddress = (address) => {
    if (!address) return "-";
    const line1 = [address.address, address.apartment].filter(Boolean).join(", ");
    const line2 = [address.city, address.state, address.pinCode].filter(Boolean).join(", ");
    const line3 = [address.country].filter(Boolean).join(", ");
    const phone = address.phoneNo ? `Phone: ${address.phoneNo}` : "";
    return [line1, line2, line3, phone].filter(Boolean).join("\n");
};

const buildItemsText = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return "-";
    return items
        .map((item, index) => {
            const parts = [
                `${index + 1}. ${normalizeText(item.name) || "Item"}`,
                `Qty ${Number(item.quantity || 0)}`,
                `Rs. ${formatMoney(item.price)}`,
            ];
            if (item.size) parts.push(`Size ${item.size}`);
            if (item.color) parts.push(`Colour ${item.color}`);
            return parts.join(" | ");
        })
        .join("\n");
};

const buildOrderNotificationMessage = ({ order, customer }) => {
    const orderCode = String(order?._id || "").slice(-8).toUpperCase();
    const customerName = normalizeText(customer?.name) || "Unknown";
    const customerEmail = normalizeText(customer?.email) || "-";
    const placedOn = new Date(order?.createdAt || Date.now()).toLocaleString("en-IN");
    const paymentStatus = normalizeText(order?.paymentInfo?.status) || "processing";
    const paymentMethod = normalizeText(order?.paymentInfo?.method) || "Razorpay";
    const shippingAddress = formatAddress(order?.shippingInfo);
    const itemsText = buildItemsText(order?.orderItems);

    return [
        "A new order has been placed.",
        "",
        `Order: #${orderCode}`,
        `Placed on: ${placedOn}`,
        `Order status: ${order?.orderStatus || "Processing"}`,
        "",
        "Customer details:",
        `Name: ${customerName}`,
        `Email: ${customerEmail}`,
        "",
        "Payment details:",
        `Status: ${paymentStatus}`,
        `Method: ${paymentMethod}`,
        "",
        "Amount details:",
        `Items: Rs. ${formatMoney(order?.itemsPrice)}`,
        `Shipping: Rs. ${formatMoney(order?.shippingPrice)}`,
        `Gift wrap: Rs. ${formatMoney(order?.giftWrapPrice)}`,
        `Total: Rs. ${formatMoney(order?.totalPrice)}`,
        "",
        "Shipping address:",
        shippingAddress,
        "",
        "Items:",
        itemsText,
    ].join("\n");
};

export const sendAdminOrderNotification = async ({ order, customer }) => {
    const adminEmail = getAdminOrderEmail();
    if (!adminEmail || !order) {
        return;
    }

    await sendEmail({
        email: adminEmail,
        subject: `New Order Received - #${String(order._id || "").slice(-8).toUpperCase()}`,
        message: buildOrderNotificationMessage({ order, customer }),
    });
};

export const queueAdminOrderNotification = ({ order, customer }) => {
    if (!order) return;
    setImmediate(() => {
        sendAdminOrderNotification({ order, customer }).catch((error) => {
            console.warn("Admin order notification failed:", error.message);
        });
    });
};
