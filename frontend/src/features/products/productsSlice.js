import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance.js";

// ── Async Thunk: Fetch all products (paginated, searchable, filterable) ──
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const {
        keyword = "",
        page = 1,
        limit = 9,
        category = "",
        subCategory = "",
        occasion = "",
        priceGte = 0,
        priceLte = 0,
        inStock = false,
        isNewArrival,
        isBestSeller,
        isFeatured,
        sort = "",
      } = params;

      let url = `/api/v1/products?page=${page}&limit=${limit}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (subCategory) url += `&subCategory=${encodeURIComponent(subCategory)}`;
      if (occasion) url += `&occasion=${encodeURIComponent(occasion)}`;
      if (priceGte > 0) url += `&price[gte]=${priceGte}`;
      if (priceLte > 0) url += `&price[lte]=${priceLte}`;
      if (inStock) url += `&stock[gt]=0`;
      if (isNewArrival) url += `&isNewArrival=true`;
      if (isBestSeller) url += `&isBestSeller=true`;
      if (isFeatured) url += `&isFeatured=true`;
      if (sort) url += `&sort=${sort}`;

      const { data } = await axiosInstance.get(url);
      return data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to fetch products";
      return rejectWithValue(message);
    }
  }
);

// ── Slice ──
const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    loading: false,
    error: null,
    productCount: 0,
    totalPages: 0,
    currentPage: 1,
    resultsPerPage: 9,
  },
  reducers: {
    clearProductsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.productCount = action.payload.productCount;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.resultsPerPage = action.payload.resultsPerPage;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProductsError } = productsSlice.actions;
export default productsSlice.reducer;
