import React, { createContext, useState, useContext, useEffect } from 'react'
import { getCart, mergeCarts, setCartLocal } from '../utils/cart'
import { cartApi } from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app startup
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        logout()
      }
    }
    
    setLoading(false)
  }, [])

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    // Sync carts: merge local guest cart with server cart and persist the merged cart to server
    ;(async () => {
      try {
        const local = getCart()
        const serverResp = await cartApi.getCart(authToken)
        const serverItems = serverResp && serverResp.items ? serverResp.items : []
        const merged = mergeCarts(local, serverItems)
        // Persist merged cart locally and to server
        setCartLocal(merged)
        await cartApi.setCart(merged, authToken)
      } catch (err) {
        console.error('Cart sync on login failed:', err)
      }
    })()
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Clear local cart on logout (user-specific carts are persisted on server)
    setCartLocal([])
  }

  const isAuthenticated = () => {
    return !!token && !!user
  }

  const getAuthHeader = () => {
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    getAuthHeader
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext