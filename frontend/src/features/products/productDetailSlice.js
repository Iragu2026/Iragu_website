import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance.js";

// ── Async Thunk: Fetch single product by ID ──
export const fetchProductDetail = createAsyncThunk(
  "productDetail/fetch",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/api/v1/product/${id}`);
      return data.product;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to fetch product";
      return rejectWithValue(message);
    }
  }
);

// ── Async Thunk: Submit or update a review ──
export const submitReview = createAsyncThunk(
  "productDetail/submitReview",
  async ({ rating, comment, productId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/api/v1/review`, {
        rating,
        comment,
        productId,
      });
      // backend responds with { success, message, product }
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to submit review";
      return rejectWithValue(message);
    }
  }
);

// ── Slice ──
const productDetailSlice = createSlice({
  name: "productDetail",
  initialState: {
    product: null,
    loading: false,
    error: null,
    // review submission state
    reviewLoading: false,
    reviewSuccess: false,
    reviewError: null,
  },
  reducers: {
    clearProductDetail(state) {
      state.product = null;
      state.error = null;
    },
    clearReviewState(state) {
      state.reviewLoading = false;
      state.reviewSuccess = false;
      state.reviewError = null;
    },
    clearProductDetailError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetch product detail ──
      .addCase(fetchProductDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ── submit review ──
      .addCase(submitReview.pending, (state) => {
        state.reviewLoading = true;
        state.reviewSuccess = false;
        state.reviewError = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.reviewLoading = false;
        state.reviewSuccess = true;
        if (action.payload?.product) {
          state.product = action.payload.product;
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.reviewLoading = false;
        state.reviewError = action.payload;
      });
  },
});

export const { clearProductDetail, clearReviewState, clearProductDetailError } =
  productDetailSlice.actions;
export default productDetailSlice.reducer;
