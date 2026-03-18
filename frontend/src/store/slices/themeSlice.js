import { createSlice } from '@reduxjs/toolkit'

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    isDark: localStorage.getItem('theme') === 'dark',
  },
  reducers: {
    toggleTheme: (state) => {
      state.isDark = !state.isDark
      const theme = state.isDark ? 'dark' : 'light'
      localStorage.setItem('theme', theme)
      if (state.isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    initTheme: (state) => {
      // Apply saved theme on app load to document element
      if (state.isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
  },
})

export const { toggleTheme, initTheme } = themeSlice.actions
export default themeSlice.reducer
