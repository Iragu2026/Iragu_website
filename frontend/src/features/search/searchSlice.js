import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance.js";

/* ── Full search (used on /search results page, collection pages) ── */
export const searchProducts = createAsyncThunk(
  "search/searchProducts",
  async (params = {}, { rejectWithValue }) => {
    const {
      keyword = "",
      page = 1,
      limit = 12,
      sort = "",
      category = "",
      subCategory = "",
      occasion = "",
      fabric = "",
      color = "",
      size = "",
      priceGte = 0,
      priceLte = 0,
      inStock = false,
      isNewArrival,
      isBestSeller,
      isFeatured,
      isOffer,
    } = params;

    let url = `/api/v1/products?page=${page}&limit=${limit}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
    if (sort) url += `&sort=${sort}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (subCategory) url += `&subCategory=${encodeURIComponent(subCategory)}`;
    if (occasion) url += `&occasion=${encodeURIComponent(occasion)}`;
    if (fabric) url += `&fabric=${encodeURIComponent(fabric)}`;
    if (color) url += `&color=${encodeURIComponent(color)}`;
    if (size) url += `&size=${encodeURIComponent(size)}`;
    if (priceGte > 0) url += `&price[gte]=${priceGte}`;
    if (priceLte > 0) url += `&price[lte]=${priceLte}`;
    if (inStock) url += `&stock[gt]=0`;
    if (isNewArrival) url += `&isNewArrival=true`;
    if (isBestSeller) url += `&isBestSeller=true`;
    if (isFeatured) url += `&isFeatured=true`;
    if (isOffer) url += `&isOffer=true`;

    // Auto-retry once on network errors (ECONNREFUSED, timeout, etc.)
    const MAX_RETRIES = 1;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data } = await axiosInstance.get(url);
        return data;
      } catch (error) {
        const isNetworkError = !error.response; // no response = network/connection failure
        if (isNetworkError && attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 800)); // wait before retry
          continue;
        }
        const msg =
          error.response?.data?.message || error.message || "Search failed";
        return rejectWithValue(msg);
      }
    }
  }
);

/* ── Lightweight preview (used in the search overlay — 4 products) ── */
export const searchPreview = createAsyncThunk(
  "search/searchPreview",
  async (keyword = "", { rejectWithValue }) => {
    try {
      if (!keyword.trim()) return { products: [], productCount: 0 };
      const { data } = await axiosInstance.get(
        `/api/v1/products?keyword=${encodeURIComponent(keyword)}&limit=4&page=1`
      );
      return data;
    } catch (error) {
      // Don't treat "no products" as a hard error for preview
      if (error.response?.status === 404) {
        return { products: [], productCount: 0 };
      }
      return rejectWithValue(
        error.response?.data?.message || "Search failed"
      );
    }
  }
);

/* ── Slice ── */
const searchSlice = createSlice({
  name: "search",
  initialState: {
    // Full results page
    results: [],
    loading: false,
    error: null,
    productCount: 0,
    totalPages: 0,
    currentPage: 1,
    resultsPerPage: 9,
    // Overlay preview
    preview: [],
    previewLoading: false,
    previewCount: 0,
  },
  reducers: {
    clearSearch(state) {
      state.results = [];
      state.loading = false;
      state.error = null;
      state.productCount = 0;
      state.totalPages = 0;
      state.currentPage = 1;
    },
    clearPreview(state) {
      state.preview = [];
      state.previewLoading = false;
      state.previewCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      /* full search */
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.products || [];
        state.productCount = action.payload.productCount ?? 0;
        state.totalPages = action.payload.totalPages ?? 0;
        state.currentPage = action.payload.currentPage ?? 1;
        state.resultsPerPage = action.payload.resultsPerPage ?? 12;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.results = [];
        state.productCount = 0;
      })
      /* preview */
      .addCase(searchPreview.pending, (state) => {
        state.previewLoading = true;
      })
      .addCase(searchPreview.fulfilled, (state, action) => {
        state.previewLoading = false;
        state.preview = action.payload.products || [];
        state.previewCount = action.payload.productCount ?? 0;
      })
      .addCase(searchPreview.rejected, (state) => {
        state.previewLoading = false;
        state.preview = [];
        state.previewCount = 0;
      });
  },
});

export const { clearSearch, clearPreview } = searchSlice.actions;
export default searchSlice.reducer;
