import { createSlice } from '@reduxjs/toolkit'
import { getSession, logout as clearAuth, setSession } from '@/lib/auth'

const authSlice = createSlice({
  name: 'auth',
  initialState: getSession(),
  reducers: {
    loginSuccess(state, action) {
      state.isAuthenticated = true
      state.email = action.payload.email
      state.name = action.payload.name
      state.role = action.payload.role
      state.permissions = action.payload.permissions || []
      setSession({ ...state })
    },
    logout(state) {
      state.isAuthenticated = false
      state.email = ''
      state.name = undefined
      state.role = undefined
      state.permissions = []
      clearAuth()
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
