import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        firstName: {
            type: String,
            default: "",
        },
        lastName: {
            type: String,
            default: "",
        },
        gst: {
            type: String,
            default: "",
        },
        address: {
            type: String,
            required: true,
        },
        apartment: {
            type: String,
            default: "",
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        pinCode: {
            type: Number,
            required: true,
        },
        phoneNo: {
            type: Number,
            required: true,
        },
    },
    // Billing details (optional). If not provided, billing can be treated same as shipping.
    billingType: {
        type: String,
        default: "same", // "same" | "different"
    },
    billingInfo: {
        firstName: { type: String, default: "" },
        lastName: { type: String, default: "" },
        gst: { type: String, default: "" },
        address: { type: String, default: "" },
        apartment: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        country: { type: String, default: "" },
        pinCode: { type: Number },
        phoneNo: { type: Number },
    },
    orderItems: [
        {
            name: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            // Optional: for products with sizes (e.g. Salwars)
            size: {
                type: String,
                default: "",
            },
            color: {
                type: String,
                default: "",
            },
            image: {
                type: String,
                required: true,
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
        }
    ],
    orderStatus: {
        type: String,
        required: true,
        default: "Processing",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    paymentInfo: {
        id: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        provider: {
            type: String,
            default: "razorpay",
        },
        method: {
            type: String,
            default: "Razorpay",
        },
        razorpayOrderId: {
            type: String,
            default: "",
        },
        razorpaySignature: {
            type: String,
            default: "",
        },
    },
    paidAt: {
        type: Date,
        required: true,
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    giftWrapPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    inventoryReserved: {
        type: Boolean,
        default: false,
    },
    deliveredAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
