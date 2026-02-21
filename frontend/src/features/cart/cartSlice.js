import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { logoutUser } from "../user/userSlice.js";
import axiosInstance from "../../utils/axiosInstance.js";

// Fetch cart from server when user logs in
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/api/v1/cart");
      return data.cart;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load cart"
      );
    }
  }
);

// Sync current cart to server (called after mutations when user is logged in)
export const syncCartToServer = createAsyncThunk(
  "cart/syncCartToServer",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { cartItems, orderNote, giftWrap } = getState().cart;
      await axiosInstance.put("/api/v1/cart", {
        cartItems,
        orderNote,
        giftWrap,
      });
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to sync cart"
      );
    }
  }
);

// Hydrate from localStorage
const storedCartItems = (() => {
  try {
    const raw = localStorage.getItem("cartItems");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

const storedOrderNote = (() => {
  try {
    return localStorage.getItem("orderNote") || "";
  } catch {
    return "";
  }
})();

const storedGiftWrap = (() => {
  try {
    return localStorage.getItem("giftWrap") === "true";
  } catch {
    return false;
  }
})();

const persistItems = (items) => {
  localStorage.setItem("cartItems", JSON.stringify(items));
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cartItems: storedCartItems,
    // each item: { product, name, price, image, stock, quantity, size }
    isDrawerOpen: false,
    orderNote: storedOrderNote,
    giftWrap: storedGiftWrap,
  },
  reducers: {
    addToCart(state, action) {
      const item = action.payload;
      // Match by product ID + size + color + giftWrap for variant-safe cart lines
      const key = `${item.product}_${item.size || ""}_${item.color || ""}_${item.giftWrap ? "gw1" : "gw0"}`;
      const existing = state.cartItems.find(
        (i) => `${i.product}_${i.size || ""}_${i.color || ""}_${i.giftWrap ? "gw1" : "gw0"}` === key
      );
      if (existing) {
        existing.quantity = item.quantity;
        existing.giftWrap = Boolean(item.giftWrap);
      } else {
        state.cartItems.push(item);
      }
      persistItems(state.cartItems);
    },
    removeFromCart(state, action) {
      // payload: { product, size, color, giftWrap } or just product string
      const { product, size } = typeof action.payload === "string"
        ? { product: action.payload, size: undefined, color: undefined, giftWrap: undefined }
        : action.payload;
      const color = typeof action.payload === "string" ? undefined : action.payload.color;
      const giftWrap =
        typeof action.payload === "string" ? undefined : action.payload.giftWrap;
      state.cartItems = state.cartItems.filter(
        (i) => !(
            i.product === product &&
            (size === undefined || i.size === size) &&
            (color === undefined || i.color === color) &&
            (giftWrap === undefined || Boolean(i.giftWrap) === Boolean(giftWrap))
          )
      );
      persistItems(state.cartItems);
    },
    updateCartQty(state, action) {
      const { product, size, color, giftWrap, quantity } = action.payload;
      const item = state.cartItems.find(
        (i) => i.product === product &&
          (size === undefined || i.size === size) &&
          (color === undefined || i.color === color) &&
          (giftWrap === undefined || Boolean(i.giftWrap) === Boolean(giftWrap))
      );
      if (item) {
        item.quantity = Math.max(1, Math.min(quantity, item.stock || 99));
      }
      persistItems(state.cartItems);
    },
    clearCart(state) {
      state.cartItems = [];
      state.orderNote = "";
      state.giftWrap = false;
      persistItems([]);
      localStorage.removeItem("orderNote");
      localStorage.removeItem("giftWrap");
    },
    openCartDrawer(state) {
      state.isDrawerOpen = true;
    },
    closeCartDrawer(state) {
      state.isDrawerOpen = false;
    },
    toggleCartDrawer(state) {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    setOrderNote(state, action) {
      state.orderNote = action.payload;
      localStorage.setItem("orderNote", action.payload);
    },
    setGiftWrap(state, action) {
      state.giftWrap = action.payload;
      localStorage.setItem("giftWrap", String(action.payload));
    },
    setCartFromServer(state, action) {
      const { cartItems = [], orderNote = "", giftWrap = false } = action.payload || {};
      state.cartItems = Array.isArray(cartItems) ? cartItems : [];
      state.orderNote = typeof orderNote === "string" ? orderNote : "";
      state.giftWrap = Boolean(giftWrap);
      persistItems(state.cartItems);
      localStorage.setItem("orderNote", state.orderNote);
      localStorage.setItem("giftWrap", String(state.giftWrap));
    },
  },
  extraReducers: (builder) => {
    // Clear cart when user logs out so the next user doesn't see their cart
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.cartItems = [];
      state.orderNote = "";
      state.giftWrap = false;
      persistItems([]);
      localStorage.removeItem("orderNote");
      localStorage.removeItem("giftWrap");
    });
    // When user logs in, cart is loaded by fetchCart (see App.jsx), not cleared here
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      const cart = action.payload || {};
      const cartItems = Array.isArray(cart.cartItems) ? cart.cartItems : [];
      const orderNote = typeof cart.orderNote === "string" ? cart.orderNote : "";
      const giftWrap = Boolean(cart.giftWrap);
      state.cartItems = cartItems;
      state.orderNote = orderNote;
      state.giftWrap = giftWrap;
      persistItems(state.cartItems);
      localStorage.setItem("orderNote", orderNote);
      localStorage.setItem("giftWrap", String(giftWrap));
    });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateCartQty,
  clearCart,
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
  setOrderNote,
  setGiftWrap,
  setCartFromServer,
} = cartSlice.actions;
export default cartSlice.reducer;
