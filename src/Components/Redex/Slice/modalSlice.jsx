import { createSlice } from "@reduxjs/toolkit";

export const modalSlice = createSlice({
    name: "modal",
    initialState: false,
    reducers: {
        addModal: (state, action) => {
            return action.payload;
        },
    },
});

export const { addModal } = modalSlice.actions;
export default modalSlice.reducer;
