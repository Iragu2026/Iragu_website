import express from "express";
import { getAllProducts, createProducts, updateProduct, deleteProduct, getSingleProductDetails, adminGetAllProducts, createAndUpdateProductReviews, getProductReviews, deleteProductReviews, uploadProductImages } from "../controller/productController.js";
import { verifyUserAuth, roleBasedAccess } from "../middleware/userAuth.js";
import { uploadProductImagesParser } from "../middleware/upload.js";

const router = express.Router();

router.route("/products").get(getAllProducts);
router.route("/admin/product/create").post(verifyUserAuth, roleBasedAccess("admin"), createProducts);
router.route("/admin/product/upload-images").post(verifyUserAuth, roleBasedAccess("admin"), uploadProductImagesParser, uploadProductImages);
router.route("/admin/product/:id").put(verifyUserAuth, roleBasedAccess("admin"), updateProduct).delete(verifyUserAuth, roleBasedAccess("admin"), deleteProduct);
router.route("/product/:id").get(getSingleProductDetails);
router.route("/admin/products").get(verifyUserAuth, roleBasedAccess("admin"), adminGetAllProducts);

router.route("/review").put(verifyUserAuth, createAndUpdateProductReviews);
router.route("/reviews").get(getProductReviews);
router.route("/reviews").delete(verifyUserAuth, deleteProductReviews);
export default router;
