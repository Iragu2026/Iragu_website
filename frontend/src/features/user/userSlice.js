import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance.js";

// ── Register (does not log in; backend returns success only) ──
export const registerUser = createAsyncThunk(
  "user/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/api/v1/register", {
        name,
        email,
        password,
      });
      // Backend returns { success, message } only — no user/token
      return data.user ? data.user : { registerOnly: true };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Registration failed"
      );
    }
  }
);

// ── Login ──
export const loginUser = createAsyncThunk(
  "user/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/api/v1/login", {
        email,
        password,
      });
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Login failed"
      );
    }
  }
);

// ── Load logged-in user (from cookie/session) ──
export const loadUser = createAsyncThunk(
  "user/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/api/v1/profile");
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Not authenticated"
      );
    }
  }
);

// ── Update Profile ──
export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async ({ name, email }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/api/v1/profile/update", {
        name,
        email,
      });
      return { user: data.user, message: data.message || "Profile updated" };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Profile update failed"
      );
    }
  }
);

// —— Update Profile Avatar ——
export const updateUserAvatar = createAsyncThunk(
  "user/updateAvatar",
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await axiosInstance.post("/api/v1/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { user: data.user, message: data.message || "Profile photo updated" };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Avatar upload failed"
      );
    }
  }
);

// Session check for public pages (returns user or null without 401 noise)
export const checkUserSession = createAsyncThunk(
  "user/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/api/v1/profile/session");
      return data.user || null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Session check failed"
      );
    }
  }
);

// —— Remove Profile Avatar ——
export const removeUserAvatar = createAsyncThunk(
  "user/removeAvatar",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.delete("/api/v1/profile/avatar");
      return { user: data.user, message: data.message || "Profile photo removed" };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Avatar remove failed"
      );
    }
  }
);

// ── Update Password ──
export const updateUserPassword = createAsyncThunk(
  "user/updatePassword",
  async ({ oldPassword, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/api/v1/password/update", {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      // backend responds with sendToken → includes user + token
      return { user: data.user, message: "Password updated successfully" };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Password update failed"
      );
    }
  }
);

// ── Forgot Password ──
export const forgotPassword = createAsyncThunk(
  "user/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/api/v1/password/forgot", {
        email,
      });
      return data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to send reset email"
      );
    }
  }
);

// ── Reset Password ──
export const resetPassword = createAsyncThunk(
  "user/resetPassword",
  async ({ token, password, confirmPassword }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/api/v1/password/reset/${token}`,
        { password, confirmPassword }
      );
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Password reset failed"
      );
    }
  }
);

// ── Logout ──
export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.get("/api/v1/logout");
      return null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Logout failed"
      );
    }
  }
);

// ── Slice ──
const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    registerSuccess: false,
    profileUpdating: false,
    passwordUpdating: false,
    avatarUpdating: false,
    avatarRemoving: false,
    profileMessage: null,
    passwordMessage: null,
    // Forgot / Reset password
    forgotPasswordMessage: null,
    forgotPasswordLoading: false,
    resetPasswordLoading: false,
  },
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
    clearForgotPasswordMessage(state) {
      state.forgotPasswordMessage = null;
    },
    clearRegisterSuccess(state) {
      state.registerSuccess = false;
    },
    clearProfileMessage(state) {
      state.profileMessage = null;
    },
    clearPasswordMessage(state) {
      state.passwordMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Helper — shared fulfilled / pending / rejected patterns
    const authPending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const authFulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    };
    const authRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
    };

    builder
      // register (success = redirect to login, no auto-login)
      .addCase(registerUser.pending, authPending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload?.registerOnly) {
          state.registerSuccess = true;
        } else {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(registerUser.rejected, authRejected)
      // login
      .addCase(loginUser.pending, authPending)
      .addCase(loginUser.fulfilled, authFulfilled)
      .addCase(loginUser.rejected, authRejected)
      // load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, authFulfilled)
      .addCase(loadUser.rejected, (state) => {
        // Silently fail — user just isn't logged in
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(checkUserSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkUserSession.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(checkUserSession.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      // logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // forgot password
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordLoading = true;
        state.error = null;
        state.forgotPasswordMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordMessage = action.payload;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.error = action.payload;
      })
      // reset password
      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.resetPasswordLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.error = action.payload;
      })
      // update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.profileUpdating = true;
        state.error = null;
        state.profileMessage = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileUpdating = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.profileMessage = action.payload.message;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileUpdating = false;
        state.error = action.payload;
      })
      // update avatar
      .addCase(updateUserAvatar.pending, (state) => {
        state.avatarUpdating = true;
        state.error = null;
        state.profileMessage = null;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action) => {
        state.avatarUpdating = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.profileMessage = action.payload.message;
      })
      .addCase(updateUserAvatar.rejected, (state, action) => {
        state.avatarUpdating = false;
        state.error = action.payload;
      })
      // remove avatar
      .addCase(removeUserAvatar.pending, (state) => {
        state.avatarRemoving = true;
        state.error = null;
        state.profileMessage = null;
      })
      .addCase(removeUserAvatar.fulfilled, (state, action) => {
        state.avatarRemoving = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.profileMessage = action.payload.message;
      })
      .addCase(removeUserAvatar.rejected, (state, action) => {
        state.avatarRemoving = false;
        state.error = action.payload;
      })
      // update password
      .addCase(updateUserPassword.pending, (state) => {
        state.passwordUpdating = true;
        state.error = null;
        state.passwordMessage = null;
      })
      .addCase(updateUserPassword.fulfilled, (state, action) => {
        state.passwordUpdating = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.passwordMessage = action.payload.message;
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.passwordUpdating = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearUserError,
  clearForgotPasswordMessage,
  clearRegisterSuccess,
  clearProfileMessage,
  clearPasswordMessage,
} = userSlice.actions;
export default userSlice.reducer;

