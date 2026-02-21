import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance.js";

export const fetchAdminProducts = createAsyncThunk(
  "adminProducts/fetch",
  async ({ category }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/v1/admin/products?category=${encodeURIComponent(category)}`
      );
      return { category, products: data.products || [] };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load products"
      );
    }
  }
);

export const createAdminProduct = createAsyncThunk(
  "adminProducts/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/api/v1/admin/product/create", payload);
      return data.product;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create product"
      );
    }
  }
);

export const updateAdminProduct = createAsyncThunk(
  "adminProducts/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/api/v1/admin/product/${id}`, updates);
      return data.product;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update product"
      );
    }
  }
);

export const deleteAdminProduct = createAsyncThunk(
  "adminProducts/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/v1/admin/product/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete product"
      );
    }
  }
);

export const uploadAdminProductImages = createAsyncThunk(
  "adminProducts/uploadImages",
  async ({ colorName, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("colorName", colorName);
      (Array.isArray(files) ? files : []).forEach((file) => {
        formData.append("images", file);
      });
      const { data } = await axiosInstance.post(
        "/api/v1/admin/product/upload-images",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return {
        colorName: data.colorName,
        images: data.images || [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload images"
      );
    }
  }
);

const adminProductsSlice = createSlice({
  name: "adminProducts",
  initialState: {
    productsByCategory: {
      Saree: [],
      Salwar: [],
    },
    loading: false,
    error: null,
    saving: false,
    deleting: false,
    uploadingImages: false,
  },
  reducers: {
    clearAdminProductsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        const { category, products } = action.payload || {};
        if (category && Array.isArray(products)) {
          state.productsByCategory[category] = products;
        }
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAdminProduct.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createAdminProduct.fulfilled, (state, action) => {
        state.saving = false;
        const p = action.payload;
        if (p?.category && state.productsByCategory[p.category]) {
          state.productsByCategory[p.category] = [p, ...state.productsByCategory[p.category]];
        }
      })
      .addCase(createAdminProduct.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateAdminProduct.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateAdminProduct.fulfilled, (state, action) => {
        state.saving = false;
        const p = action.payload;
        if (!p?.category || !state.productsByCategory[p.category]) return;
        state.productsByCategory[p.category] = state.productsByCategory[p.category].map((x) => x._id === p._id ? p : x
        );
      })
      .addCase(updateAdminProduct.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(deleteAdminProduct.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteAdminProduct.fulfilled, (state, action) => {
        state.deleting = false;
        const id = action.payload;
        Object.keys(state.productsByCategory).forEach((cat) => {
          state.productsByCategory[cat] = state.productsByCategory[cat].filter((p) => p._id !== id);
        });
      })
      .addCase(deleteAdminProduct.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      })
      .addCase(uploadAdminProductImages.pending, (state) => {
        state.uploadingImages = true;
        state.error = null;
      })
      .addCase(uploadAdminProductImages.fulfilled, (state) => {
        state.uploadingImages = false;
      })
      .addCase(uploadAdminProductImages.rejected, (state, action) => {
        state.uploadingImages = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminProductsError } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;

