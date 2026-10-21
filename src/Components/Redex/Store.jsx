import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./Slice/UserSlice";
import postReducer from "./Slice/PostSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        post: postReducer,
    }
})
