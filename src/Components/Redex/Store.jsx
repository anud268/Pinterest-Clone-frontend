import { configureStore } from "@reduxjs/toolkit";
import  userReducer from "./Slice/UserSlice";
import  picReducer from "./Slice/picSlice";
import  postReducer from "./Slice/PostSlice";
import  modalReducer from "./Slice/modalSlice";
import  sidebarReducer from "./Slice/navbarSlice";
import  selectReducer from "./Slice/selectPageSlice";

export const store = configureStore({
    reducer:{
        user:userReducer,
        pic:picReducer,    
        post:postReducer,
        modal:modalReducer,
        sidebar:sidebarReducer,
        select:selectReducer,
    }
})
 