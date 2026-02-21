import mongoose from "mongoose";

const EXCHANGE_STATUSES = ["Pending", "Exchange Accepted", "Exchange Rejected"];

const exchangeRequestSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [80, "Name cannot exceed 80 characters"],
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        mobileNumber: {
            type: String,
            required: true,
            trim: true,
            maxlength: [10, "Mobile number must be 10 digits"],
        },
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: [400, "Address cannot exceed 400 characters"],
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: [1000, "Reason cannot exceed 1000 characters"],
        },
        status: {
            type: String,
            enum: EXCHANGE_STATUSES,
            default: "Pending",
        },
        decisionAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export const EXCHANGE_REQUEST_STATUSES = EXCHANGE_STATUSES;
export default mongoose.model("ExchangeRequest", exchangeRequestSchema);

