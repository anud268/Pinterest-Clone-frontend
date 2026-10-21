import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../../lib/api";

// Restores the session from the auth cookie. A 401 simply means "signed out".
export const fetchSession = createAsyncThunk("user/fetchSession", async () => {
  try {
    const { data } = await api.get("/fetchuser", { skipAuthHandler: true });
    return data.user;
  } catch (error) {
    if (error.response?.status === 401) return null;
    throw error;
  }
});

export const userSlice = createSlice({
  name: "user",
  // status: idle -> loading -> authenticated | guest | error
  initialState: { status: "idle", current: null },
  reducers: {
    addUser: (state, action) => {
      state.current = action.payload;
      state.status = action.payload ? "authenticated" : "guest";
    },
    signedOut: (state) => {
      state.current = null;
      state.status = "guest";
    },
    setUserImage: (state, action) => {
      if (state.current) state.current.image = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSession.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.current = action.payload;
        state.status = action.payload ? "authenticated" : "guest";
      })
      .addCase(fetchSession.rejected, (state) => {
        state.status = "error";
      });
  },
});

export const { addUser, signedOut, setUserImage } = userSlice.actions;

export const selectUser = (state) => state.user.current;
export const selectAuthStatus = (state) => state.user.status;

export default userSlice.reducer;
