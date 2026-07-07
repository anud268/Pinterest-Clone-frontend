import { createSlice } from "@reduxjs/toolkit";

export const sidebarSlice = createSlice({
    name: "sidebar",
    initialState: false,
    reducers: {
        showSidebar: (state, action) => {
            return action.payload;
        },
    },
});

export const { showSidebar } = sidebarSlice.actions;
export default sidebarSlice.reducer;
