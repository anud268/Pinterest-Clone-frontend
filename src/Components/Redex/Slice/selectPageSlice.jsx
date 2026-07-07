import { createSlice } from "@reduxjs/toolkit";

export const selectPageSlice = createSlice({
  name: "select",
  initialState: "",
  reducers: {
    selectPage: (state, action) => {
      return action.payload;
    },
  },
});

export const { selectPage } = selectPageSlice.actions;
export default selectPageSlice.reducer;
