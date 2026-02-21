import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "../features/products/productsSlice.js";
import productDetailReducer from "../features/products/productDetailSlice.js";
import userReducer from "../features/user/userSlice.js";
import cartReducer, {
  addToCart,
  removeFromCart,
  updateCartQty,
  clearCart,
  setOrderNote,
  setGiftWrap,
  syncCartToServer,
} from "../features/cart/cartSlice.js";
import ordersReducer from "../features/orders/ordersSlice.js";
import adminProductsReducer from "../features/admin/adminProductsSlice.js";
import adminUsersReducer from "../features/admin/adminUsersSlice.js";
import adminOrdersReducer from "../features/admin/adminOrdersSlice.js";
import adminExchangesReducer from "../features/admin/adminExchangesSlice.js";
import searchReducer from "../features/search/searchSlice.js";

const cartMutationTypes = [
  addToCart.type,
  removeFromCart.type,
  updateCartQty.type,
  clearCart.type,
  setOrderNote.type,
  setGiftWrap.type,
];

const cartSyncMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (
    cartMutationTypes.includes(action.type) &&
    store.getState().user.isAuthenticated
  ) {
    store.dispatch(syncCartToServer());
  }
  return result;
};

const store = configureStore({
  reducer: {
    products: productsReducer,
    productDetail: productDetailReducer,
    user: userReducer,
    cart: cartReducer,
    orders: ordersReducer,
    adminProducts: adminProductsReducer,
    adminUsers: adminUsersReducer,
    adminOrders: adminOrdersReducer,
    adminExchanges: adminExchangesReducer,
    search: searchReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cartSyncMiddleware),
});

export default store;
