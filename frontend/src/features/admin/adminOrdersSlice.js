import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance.js";

export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/api/v1/admin/orders");
      return { orders: data.orders || [], totalAmount: data.totalAmount || 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load orders"
      );
    }
  }
);

export const updateAdminOrderStatus = createAsyncThunk(
  "adminOrders/updateStatus",
  async ({ id, orderStatus }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/api/v1/admin/order/${id}`, {
        orderStatus,
      });
      return data.order;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update order status"
      );
    }
  }
);

const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState: {
    orders: [],
    totalAmount: 0,
    loading: false,
    error: null,
    updating: false,
  },
  reducers: {
    clearAdminOrdersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders || [];
        state.totalAmount = action.payload.totalAmount || 0;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminOrderStatus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, action) => {
        state.updating = false;
        const o = action.payload;
        state.orders = state.orders.map((x) => (x._id === o._id ? o : x));
      })
      .addCase(updateAdminOrderStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminOrdersError } = adminOrdersSlice.actions;
export default adminOrdersSlice.reducer;

