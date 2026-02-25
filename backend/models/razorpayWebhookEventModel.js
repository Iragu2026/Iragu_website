import mongoose from "mongoose";

const razorpayWebhookEventSchema = new mongoose.Schema({
    dedupeKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    eventType: {
        type: String,
        default: "",
        trim: true,
    },
    paymentId: {
        type: String,
        default: "",
        trim: true,
    },
    razorpayOrderId: {
        type: String,
        default: "",
        trim: true,
    },
    status: {
        type: String,
        enum: ["processed", "ignored", "failed"],
        default: "processed",
    },
    note: {
        type: String,
        default: "",
    },
    processedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default mongoose.model("RazorpayWebhookEvent", razorpayWebhookEventSchema);
