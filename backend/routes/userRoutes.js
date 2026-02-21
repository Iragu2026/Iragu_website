import express from "express";
import { registerUser, loginUser, logoutUser, requestPasswordReset, resetPassword, getUserDetails, getSessionUser, updatePassword, updateProfile, updateProfileAvatar, removeProfileAvatar, getCart, updateCart, getAllUsers, getSingleUserDetails, updateUserRole, deleteUser } from "../controller/userController.js";
import {verifyUserAuth, roleBasedAccess} from "../middleware/userAuth.js";
import { uploadAvatarParser } from "../middleware/upload.js";

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/password/forgot").post(requestPasswordReset);
router.route("/password/reset/:token").post(resetPassword);
router.route("/profile/session").get(getSessionUser);
router.route("/profile").get(verifyUserAuth, getUserDetails);
router.route("/password/update").post(verifyUserAuth, updatePassword);
router.route("/profile/update").post(verifyUserAuth, updateProfile);
router.route("/profile/avatar")
    .post(verifyUserAuth, uploadAvatarParser, updateProfileAvatar)
    .delete(verifyUserAuth, removeProfileAvatar);
router.route("/cart").get(verifyUserAuth, getCart).put(verifyUserAuth, updateCart);
router.route("/admin/users").get(verifyUserAuth, roleBasedAccess("admin"), getAllUsers);
router.route("/admin/user/:id").get(verifyUserAuth, roleBasedAccess("admin"), getSingleUserDetails).put(verifyUserAuth, roleBasedAccess("admin"), updateUserRole);
router.route("/admin/user/delete/:id").delete(verifyUserAuth, roleBasedAccess("admin"), deleteUser);
export default router;
