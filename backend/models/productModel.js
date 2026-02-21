import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter the Product name"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please enter the Product description"],
    },
    price: {
        type: Number,
        required: [true, "Please enter the Product price"],
        maxLength: [8, "Price cannot exceed 8 characters"],
    },
    ratings: {
        type: Number,
        default: 0,
    },
    images: [
        {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
            key: {
                type: String,
                default: "",
            },
        },
    ],

    // ── Category & Classification ──
    category: {
        type: String,
        required: [true, "Please enter the Product category"],
        enum: {
            values: ["Saree", "Blouse", "Salwar"],
            message: "Category must be Saree, Blouse, or Salwar",
        },
    },
    subCategory: {
        type: String,
        trim: true,
        default: "",
        // Saree: "Kalamkari, Mul Cotton" (comma-separated if multiple)
        // Blouse: "Readymade", "Designer", etc.
        // Salwar: "Churidar", "Patiala", "Palazzo", etc.
    },
    occasion: {
        type: [String],
        default: [],
        // e.g. ["Casual Wear", "Festive Wear", "Office Wear", "Wedding"]
    },

    // ── Flags for Home Page Sections ──
    isNewArrival: {
        type: Boolean,
        default: false,
    },
    isBestSeller: {
        type: Boolean,
        default: false,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    isOffer: {
        type: Boolean,
        default: false,
    },

    // ── Variants ──
    sizes: {
        type: [String],
        default: [],
        // Blouses/Salwars: ["XS", "S", "M", "L", "XL", "2XL"]
        // Sarees: leave empty (no sizes for sarees)
    },
    colors: [
        {
            name: { type: String, required: true },   // e.g. "Red"
            hex: { type: String, default: "" },        // e.g. "#FF0000"
        },
    ],
    colorImages: [
        {
            colorName: {
                type: String,
                required: true,
                trim: true,
            },
            images: [
                {
                    public_id: {
                        type: String,
                        required: true,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                    key: {
                        type: String,
                        default: "",
                    },
                },
            ],
        },
    ],

    // ── Fabric & Care ──
    fabric: {
        type: String,
        default: "",
        // e.g. "Pure Cotton", "Linen Blend"
    },
    length: {
        type: String,
        default: "",
        // Saree length (e.g. "6.25 meters")
    },
    washCare: {
        type: String,
        default: "",
        // e.g. "Dry clean only"
    },
    shippingInfo: {
        type: String,
        default: "",
        // e.g. "Ships within 3-5 business days"
    },

    // ── Stock ──
    stock: {
        type: Number,
        required: [true, "Please enter the Product stock"],
        maxLength: [5, "Stock cannot exceed 5 characters"],
        default: 1,
    },

    // ── Reviews ──
    numOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            comment: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],

    // ── Meta ──
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// ── Indexes for faster queries ──
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isOffer: 1 });
productSchema.index({ name: "text", description: "text" });

export default mongoose.model("Product", productSchema);
