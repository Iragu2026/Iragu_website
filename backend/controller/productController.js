import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import ErrorHandler from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import ApiFunctionality from "../utils/apiFunctionality.js";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { deleteObjectsFromR2, isR2Configured, uploadBufferToR2 } from "../utils/r2Storage.js";

const normalizeSubCategory = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((v) => String(v || "").trim())
            .filter(Boolean)
            .join(", ");
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .join(", ");
    }
    return "";
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return trimmed
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean);
        }
    }
    return [];
};

const normalizeImageEntries = (value) => {
    return toArray(value)
        .map((item) => ({
            public_id: String(item?.public_id || item?.publicId || item?.key || "").trim(),
            url: String(item?.url || "").trim(),
            key: String(item?.key || item?.public_id || "").trim(),
        }))
        .filter((img) => Boolean(img.url));
};

const normalizeColors = (value) => {
    return toArray(value)
        .map((item) => ({
            name: String(item?.name || "").trim(),
            hex: String(item?.hex || "").trim(),
        }))
        .filter((c) => Boolean(c.name));
};

const normalizeOccasions = (value) => {
    return toArray(value)
        .map((v) => String(v || "").trim())
        .filter(Boolean);
};

const normalizeColorImages = (value) => {
    return toArray(value)
        .map((entry) => ({
            colorName: String(entry?.colorName || entry?.name || "").trim(),
            images: normalizeImageEntries(entry?.images),
        }))
        .filter((entry) => Boolean(entry.colorName) && entry.images.length > 0);
};

const mergeColorsFromColorImages = (colors, colorImages) => {
    const map = new Map();
    (Array.isArray(colors) ? colors : []).forEach((c) => {
        if (!c?.name) return;
        map.set(c.name.toLowerCase(), { name: c.name, hex: c.hex || "" });
    });
    (Array.isArray(colorImages) ? colorImages : []).forEach((ci) => {
        const name = String(ci?.colorName || "").trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (!map.has(key)) {
            map.set(key, { name, hex: "" });
        }
    });
    return Array.from(map.values());
};

const flattenColorImages = (colorImages) =>
    (Array.isArray(colorImages) ? colorImages : [])
        .flatMap((ci) => (Array.isArray(ci.images) ? ci.images : []))
        .filter((img) => Boolean(img?.url));

const extractImageKeys = (product) => {
    const keys = new Set();
    const pushKey = (img) => {
        const key = String(img?.key || img?.public_id || "").trim();
        if (key) keys.add(key);
    };
    (Array.isArray(product?.images) ? product.images : []).forEach(pushKey);
    (Array.isArray(product?.colorImages) ? product.colorImages : []).forEach((ci) => {
        (Array.isArray(ci?.images) ? ci.images : []).forEach(pushKey);
    });
    return Array.from(keys);
};

// 1. Creating Products
export const createProducts = handleAsyncError(async (req, res, next) => {
    if (Object.prototype.hasOwnProperty.call(req.body, "subCategory")) {
        req.body.subCategory = normalizeSubCategory(req.body.subCategory);
    }
    if (hasOwn(req.body, "occasion")) {
        req.body.occasion = normalizeOccasions(req.body.occasion);
    }
    if (hasOwn(req.body, "colors")) {
        req.body.colors = normalizeColors(req.body.colors);
    }
    if (hasOwn(req.body, "images")) {
        req.body.images = normalizeImageEntries(req.body.images);
    }
    if (hasOwn(req.body, "colorImages")) {
        req.body.colorImages = normalizeColorImages(req.body.colorImages);
        req.body.images = flattenColorImages(req.body.colorImages);
        req.body.colors = mergeColorsFromColorImages(req.body.colors, req.body.colorImages);
    }
    req.body.user = req.user._id;
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: product
    });
});

// 1A. Upload product images to Cloudflare R2 (admin)
export const uploadProductImages = handleAsyncError(async (req, res, next) => {
    if (!isR2Configured()) {
        return next(new ErrorHandler("Cloudflare R2 is not configured in environment", 500));
    }
    const colorName = String(req.body?.colorName || "").trim();
    if (!colorName) {
        return next(new ErrorHandler("Please select a color name before uploading", 400));
    }
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
        return next(new ErrorHandler("Please upload at least one image file", 400));
    }

    const uploads = [];
    for (const file of files) {
        const metadata = await sharp(file.buffer).metadata();
        const shouldResize = typeof metadata.width === "number" && metadata.width > 2400;
        const optimizedBuffer = await sharp(file.buffer)
            .rotate()
            .resize(
                shouldResize
                    ? { width: 2400, withoutEnlargement: true }
                    : undefined
            )
            .webp({
                quality: 90,
                effort: 5,
                smartSubsample: true,
            })
            .toBuffer();
        const key = `products/${Date.now()}-${nanoid(10)}.webp`;
        const stored = await uploadBufferToR2({
            key,
            buffer: optimizedBuffer,
            contentType: "image/webp",
        });
        uploads.push({
            public_id: key,
            key: key,
            url: stored.url,
        });
    }

    res.status(201).json({
        success: true,
        colorName,
        images: uploads,
    });
});

// 2. Getting All Products (supports keyword, filters, sort, pagination)
export const getAllProducts = handleAsyncError(async (req, res, next) => {
    const resultsPerPage = Number(req.query.limit) || 9;

    // Exclude heavy review arrays from list responses
    const apiFeatures = new ApiFunctionality(Product.find().select("-reviews"), req.query)
        .search()
        .filter();

    // Count matching products (before pagination & sort)
    const productCount = await Product.countDocuments(apiFeatures.query.getQuery());

    const totalPages = Math.ceil(productCount / resultsPerPage);
    const page = Number(req.query.page) || 1;

    if (page > totalPages && productCount > 0) {
        return next(new ErrorHandler("Page number is out of bounds", 404));
    }

    // Apply sort + pagination
    apiFeatures.sort().pagination(resultsPerPage);
    const products = await apiFeatures.query;

    res.status(200).json({
        success: true,
        products: products || [],
        productCount: productCount,
        totalPages: totalPages,
        currentPage: page,
        resultsPerPage: resultsPerPage,
    });
});

// 3. Update A Product
export const updateProduct = handleAsyncError(async (req, res, next) => {
    if (Object.prototype.hasOwnProperty.call(req.body, "subCategory")) {
        req.body.subCategory = normalizeSubCategory(req.body.subCategory);
    }
    if (hasOwn(req.body, "occasion")) {
        req.body.occasion = normalizeOccasions(req.body.occasion);
    }
    if (hasOwn(req.body, "colors")) {
        req.body.colors = normalizeColors(req.body.colors);
    }
    if (hasOwn(req.body, "images")) {
        req.body.images = normalizeImageEntries(req.body.images);
    }
    if (hasOwn(req.body, "colorImages")) {
        req.body.colorImages = normalizeColorImages(req.body.colorImages);
        req.body.images = flattenColorImages(req.body.colorImages);
        req.body.colors = mergeColorsFromColorImages(req.body.colors, req.body.colorImages);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if(!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: product
    });
});

// 4. Delete A Product
export const deleteProduct = handleAsyncError(async (req, res, next) => {
    const existing = await Product.findById(req.params.id);
    if(!existing) {
        return next(new ErrorHandler("Product not found", 404));
    }
    await Product.findByIdAndDelete(req.params.id);
    const keys = extractImageKeys(existing);
    if (keys.length) {
        try {
            await deleteObjectsFromR2(keys);
        } catch (error) {
            console.warn("R2 cleanup failed:", error.message);
        }
    }
    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    });
});


// 5. Accessing Single Product Details
export const getSingleProductDetails = handleAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if(!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
        success: true,
        message: "Product details",
        product: product
    });
});


// 6. Creating and Updating Product Reviews
export const createAndUpdateProductReviews = handleAsyncError(async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    if (!productId) {
        return next(new ErrorHandler("Product ID is required", 400));
    }
    const normalizedProductId = String(productId).trim();
    if (!/^[0-9a-fA-F]{24}$/.test(normalizedProductId)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return next(new ErrorHandler("Rating must be between 1 and 5", 400));
    }
    if (!String(comment || "").trim()) {
        return next(new ErrorHandler("Please write a review", 400));
    }

    const hasDeliveredPurchase = await Order.exists({
        user: req.user._id,
        orderStatus: { $regex: /^delivered$/i },
        "orderItems.product": normalizedProductId,
    });

    if (!hasDeliveredPurchase) {
        return next(new ErrorHandler("You can review only products from your delivered orders.", 403));
    }

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: parsedRating,
        comment: String(comment).trim(),
    };
    const product = await Product.findById(normalizedProductId);
    if(!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString());
    // Enforce one review per user per product
    if (isReviewed) {
        return next(new ErrorHandler("You have already reviewed this product.", 400));
    }

    product.reviews.push(review);
    let averageRating = 0;
    product.reviews.forEach(rev => {
        averageRating += rev.rating;
    });
    if(product.reviews.length === 0) {
        averageRating = 0;
    } else {
        averageRating = averageRating / product.reviews.length;
    }
    product.ratings = averageRating;
    product.numOfReviews = product.reviews.length;
    await product.save({ validateBeforeSave: true });
    res.status(200).json({
        success: true,
        message: "Review submitted successfully",
        product: product
    });
});


// 7. Getting Product Reviews
export const getProductReviews = handleAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    if(!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
        success: true,
        reviews: product.reviews
    });
});

// 8. Deleting Product Reviews
export const deleteProductReviews = handleAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if(!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    const reviews = product.reviews.filter(rev => rev.user.toString() !== req.user._id.toString());
    product.reviews = reviews;
    let averageRating = 0;
    reviews.forEach(rev => {
        averageRating += rev.rating;
    });
    if(reviews.length === 0) {
        averageRating = 0;
    } else {
        averageRating = averageRating / reviews.length;
    }
    product.ratings = averageRating;
    product.numOfReviews = reviews.length;
    await Product.findByIdAndUpdate(req.query.productId, {
        reviews: reviews,
        ratings: averageRating,
        numOfReviews: reviews.length,
    }, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        message: "Review deleted successfully"
    });
});


// 9. Admin Get All Products
export const adminGetAllProducts = handleAsyncError(async (req, res, next) => {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        products: products
    });
});
