import { createSlice } from "@reduxjs/toolkit";

export const picSlice = createSlice({
    name:"demo",
    initialState:{},
    reducers:{
      addPic:(state,action)=>{
          return action.payload
      }
    }
})


export const {addPic} = picSlice.actions

export default picSlice.reducer