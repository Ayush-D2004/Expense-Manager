import { createSlice } from '@reduxjs/toolkit'

const userFromStorage = localStorage.getItem('user')
const tokenFromStorage = localStorage.getItem('token')

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: userFromStorage ? JSON.parse(userFromStorage) : null,
    token: tokenFromStorage || null,
    isAuthenticated: !!tokenFromStorage,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, access_token } = action.payload
      state.user = user
      state.token = access_token
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', access_token)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
