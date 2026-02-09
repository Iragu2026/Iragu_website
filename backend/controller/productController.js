import Product from "../models/productModel.js";
import ErrorHandler from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import ApiFunctionality from "../utils/apiFunctionality.js";

// 1. Creating Products
export const createProducts = handleAsyncError(async (req, res, next) => {
    req.body.user = req.user._id;
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: product
    });
});

// 2. Getting All Products
export const getAllProducts = handleAsyncError(async (req, res, next) => {
    const resultsPerPage = 9;
    const apiFeatures = new ApiFunctionality(Product.find(), req.query).search().filter();

    // Getting Filtered Products
    const productCount = await Product.countDocuments(apiFeatures.query.getQuery());
    
    // Calculate total pages based on filtered count
    const totalPages = Math.ceil(productCount / resultsPerPage);
    const page = Number(req.query.page) || 1;
    
    if(page > totalPages && productCount > 0) {
        return next(new ErrorHandler("Page number is out of bounds", 404));
    }

    apiFeatures.pagination(resultsPerPage);
    const products = await apiFeatures.query;

    if(!products || products.length === 0) {
        return next(new ErrorHandler("No products found", 404));
    }

    res.status(200).json({
        success: true,
        products: products,
        productCount: productCount,
        totalPages: totalPages,
        currentPage: page,
        resultsPerPage: resultsPerPage
    });
});

// 3. Update A Product
export const updateProduct = handleAsyncError(async (req, res, next) => {
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
    const product = await Product.findByIdAndDelete(req.params.id);
    if(!product) {
        return next(new ErrorHandler("Product not found", 404));
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
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment: comment,
    };
    const product = await Product.findById(productId);
    if(!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString());
    if(isReviewed) {
        product.reviews.forEach(rev => {
            if(rev.user.toString() === req.user._id.toString()) {
                rev.rating = rating;
                rev.comment = comment;
            }
        });
    } else {
        product.reviews.push(review);
    }
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
    await product.save();
    res.status(200).json({
        success: true,
        message: "Review updated successfully",
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
    const products = await Product.find();
    res.status(200).json({
        success: true,
        products: products
    });
});
