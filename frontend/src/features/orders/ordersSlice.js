import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance.js";

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/api/v1/orders/user");
      return data.orders || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load orders"
      );
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
  "orders/fetchOrderDetails",
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/api/v1/order/${orderId}`);
      return data.order;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load order details"
      );
    }
  }
);

export const createRazorpayOrder = createAsyncThunk(
  "orders/createRazorpayOrder",
  async ({ orderItems }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/api/v1/payment/razorpay/order", {
        orderItems,
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to initialize payment"
      );
    }
  }
);

export const verifyRazorpayPayment = createAsyncThunk(
  "orders/verifyRazorpayPayment",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/api/v1/payment/razorpay/verify", payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Payment verification failed"
      );
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    loading: false,
    error: null,
    selectedOrder: null,
    selectedLoading: false,
    selectedError: null,
    paymentLoading: false,
    paymentError: null,
    lastPlacedOrder: null,
  },
  reducers: {
    clearOrdersError(state) {
      state.error = null;
    },
    clearSelectedOrder(state) {
      state.selectedOrder = null;
      state.selectedError = null;
      state.selectedLoading = false;
    },
    clearPaymentState(state) {
      state.paymentError = null;
      state.paymentLoading = false;
      state.lastPlacedOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchOrderDetails.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      })
      .addCase(createRazorpayOrder.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(createRazorpayOrder.fulfilled, (state) => {
        state.paymentLoading = false;
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })
      .addCase(verifyRazorpayPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(verifyRazorpayPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.lastPlacedOrder = action.payload?.order || null;
      })
      .addCase(verifyRazorpayPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      });
  },
});

export const { clearOrdersError, clearSelectedOrder, clearPaymentState } =
  ordersSlice.actions;
export default ordersSlice.reducer;

