import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'
import { cartApi } from '../utils/api'

const Header = () => {
  const [cartCount, setCartCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0))
    }
    updateCartCount()
    window.addEventListener('storage', updateCartCount)
    // listen to cartUpdated events
    const handler = () => updateCartCount()
    window.addEventListener('cartUpdated', handler)
    // if authenticated, try to fetch server cart periodically
    let mounted = true
    ;(async () => {
      if (isAuthenticated() && mounted) {
        try {
          const token = localStorage.getItem('token')
          const resp = await cartApi.getCart(token)
          if (resp && resp.items) {
            setCartCount(resp.items.reduce((s, it) => s + (it.quantity || 0), 0))
          }
        } catch (err) {
          console.error('Failed to fetch server cart count:', err)
        }
      }
    })()
    const interval = setInterval(updateCartCount, 500)
    return () => {
      window.removeEventListener('storage', updateCartCount)
      window.removeEventListener('cartUpdated', handler)
      clearInterval(interval)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsUserMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="55" y="70" width="10" height="30" fill="#8B4513" rx="2"/>
                <circle cx="60" cy="50" r="25" fill="#D4AF37" opacity="0.9"/>
                <circle cx="45" cy="45" r="20" fill="#D4AF37" opacity="0.8"/>
                <circle cx="75" cy="45" r="20" fill="#D4AF37" opacity="0.8"/>
                <circle cx="50" cy="35" r="18" fill="#D4AF37" opacity="0.7"/>
                <circle cx="70" cy="35" r="18" fill="#D4AF37" opacity="0.7"/>
                <circle cx="60" cy="25" r="15" fill="#D4AF37" opacity="0.6"/>
              </svg>
            </span>
            <span className="logo-text">Vruksha</span>
          </Link>
          
          <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/" state={{ scrollTo: 'services' }} onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
          </nav>

          <div className="header-actions">
            <Link to="/cart" className="cart-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V19C17 20.1 16.1 21 15 21H9C7.9 21 7 20.1 7 19V13H17Z" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            
            {isAuthenticated() ? (
              <div className="user-menu">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="user-avatar">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" stroke="white" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/>
                    </svg>
                  </div>
                  <span className="user-name">{user?.name || 'User'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                {isUserMenuOpen && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <p className="user-menu-name">{user?.name}</p>
                      <p className="user-menu-email">{user?.email}</p>
                    </div>
                    <div className="user-menu-divider"></div>
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        navigate('/profile')
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" stroke="#666" strokeWidth="1.5"/>
                        <circle cx="12" cy="7" r="4" stroke="#666" strokeWidth="1.5"/>
                      </svg>
                      My Profile
                    </button>
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        navigate('/orders')
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#666" strokeWidth="1.5"/>
                        <path d="M9 9L15 15M15 9L9 15" stroke="#666" strokeWidth="1.5"/>
                      </svg>
                      My Orders
                    </button>
                    <div className="user-menu-divider"></div>
                    <button className="user-menu-item logout-btn" onClick={handleLogout}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.45 21 4 20.55 4 20V4C4 3.45 4.45 3 5 3H9" stroke="#666" strokeWidth="1.5"/>
                        <path d="M16 17L21 12L16 7M21 12H9" stroke="#666" strokeWidth="1.5"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="nav-auth-btn login-btn">Sign In</Link>
                <Link to="/register" className="nav-auth-btn register-btn">Sign Up</Link>
              </div>
            )}
            
            <button 
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

