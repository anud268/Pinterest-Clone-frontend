import { createSlice } from "@reduxjs/toolkit";

export const postSlice = createSlice({
    name: "post",
    initialState: [],
    reducers: {
        addPost: (state, action) => {
            return action.payload;
        },
    },
});

export const { addPost } = postSlice.actions;
export default postSlice.reducer;
