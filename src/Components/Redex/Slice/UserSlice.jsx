import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
    name:"demo",
    initialState:{},
    reducers:{
      addUser:(state,action)=>{
          return action.payload
      }
    }
})


export const {addUser} = userSlice.actions

export default userSlice.reducer