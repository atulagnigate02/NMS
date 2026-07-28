import { createSlice } from '@reduxjs/toolkit'

const stored = typeof window !== 'undefined' ? window.localStorage.getItem('nms-theme') : null

const initialState = {
  mode: stored === 'light' ? 'light' : 'dark',
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action) {
      state.mode = action.payload
      window.localStorage.setItem('nms-theme', action.payload)
      document.documentElement.setAttribute('data-theme', action.payload)
    },
    toggleTheme(state) {
      const next = state.mode === 'dark' ? 'light' : 'dark'
      state.mode = next
      window.localStorage.setItem('nms-theme', next)
      document.documentElement.setAttribute('data-theme', next)
    },
  },
})

export const { setTheme, toggleTheme } = themeSlice.actions
export default themeSlice.reducer
