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
    
    const init = async () => {
      if (storedToken) {
        // try to refresh user from server to ensure we have latest claims (is_admin etc.)
        try {
          const resp = await fetch('http://localhost:8000/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          })
          if (resp.ok) {
            const data = await resp.json()
            setToken(storedToken)
            setUser(data)
            localStorage.setItem('token', storedToken)
            localStorage.setItem('user', JSON.stringify(data))
          } else {
            // token invalid or expired
            console.warn('Stored token invalid, clearing auth')
            logout()
          }
        } catch (err) {
          console.error('Failed to refresh user on startup:', err)
          // fallback to stored user if present
          if (storedUser) {
            try {
              setToken(storedToken)
              setUser(JSON.parse(storedUser))
            } catch (error) {
              console.error('Error parsing stored user data:', error)
              logout()
            }
          }
        }
      } else if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          logout()
        }
      }
    }

    // Run init and only mark loading false afterwards to avoid flashes/redirects
    init().then(() => setLoading(false)).catch(() => setLoading(false))
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