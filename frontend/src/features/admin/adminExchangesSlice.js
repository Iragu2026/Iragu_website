import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance.js";

export const fetchAdminExchanges = createAsyncThunk(
  "adminExchanges/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/api/v1/admin/exchanges");
      return data.exchangeRequests || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load exchange requests"
      );
    }
  }
);

export const updateAdminExchangeStatus = createAsyncThunk(
  "adminExchanges/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/api/v1/admin/exchange/${id}`, { status });
      return data.exchangeRequest;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update exchange status"
      );
    }
  }
);

const adminExchangesSlice = createSlice({
  name: "adminExchanges",
  initialState: {
    exchangeRequests: [],
    loading: false,
    updating: false,
    error: null,
  },
  reducers: {
    clearAdminExchangesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminExchanges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminExchanges.fulfilled, (state, action) => {
        state.loading = false;
        state.exchangeRequests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminExchanges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminExchangeStatus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateAdminExchangeStatus.fulfilled, (state, action) => {
        state.updating = false;
        const updated = action.payload;
        state.exchangeRequests = state.exchangeRequests.map((request) => request._id === updated?._id ? updated : request
        );
      })
      .addCase(updateAdminExchangeStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminExchangesError } = adminExchangesSlice.actions;
export default adminExchangesSlice.reducer;

