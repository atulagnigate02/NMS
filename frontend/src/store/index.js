import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/store/authSlice'
import themeReducer from '@/store/themeSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
  },
})
