import { createSlice } from "@reduxjs/toolkit";

// Cache of the home feed so returning from a pin shows it instantly at the same scroll position.
const initialState = { key: null, items: [], page: 0, hasMore: true, scrollY: 0 };

export const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    feedLoaded: (state, action) => {
      const { key, posts, page, hasMore } = action.payload;
      if (key !== state.key || page === 1) {
        state.key = key;
        state.items = posts;
        state.scrollY = 0;
      } else {
        const seen = new Set(state.items.map((p) => p._id));
        state.items.push(...posts.filter((p) => !seen.has(p._id)));
      }
      state.page = page;
      state.hasMore = hasMore;
    },
    feedScrolled: (state, action) => {
      state.scrollY = action.payload;
    },
    // Keep cached copies in sync when a pin changes elsewhere (detail page, menus)
    postChanged: (state, action) => {
      const index = state.items.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) state.items[index] = { ...state.items[index], ...action.payload };
    },
    postRemoved: (state, action) => {
      state.items = state.items.filter((p) => p._id !== action.payload);
    },
    feedReset: () => initialState,
  },
});

export const { feedLoaded, feedScrolled, postChanged, postRemoved, feedReset } = postSlice.actions;
export default postSlice.reducer;
