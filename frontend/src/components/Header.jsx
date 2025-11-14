import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Header.css'
import { cartApi } from '../utils/api'
import { ShoppingCart, User, ChevronDown, UserCheck, Box, LogOut, Heart } from 'lucide-react'

const Header = () => {
  const [cartCount, setCartCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      // cartCount should reflect number of distinct items in the cart (length)
      setCartCount(cart.length)
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
            setCartCount((resp.items || []).length)
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
            <Link to="/cart" className="cart-icon" aria-label="View cart">
              <ShoppingCart size={20} color="#333" />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            
            {isAuthenticated() ? (
              <div className="user-menu">
                <button 
                  className="user-menu-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="user-avatar">
                    <User size={18} color="white" />
                  </div>
                  <span className="user-name">{user?.name || 'User'}</span>
                  <ChevronDown size={16} color="#333" />
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
                      <UserCheck size={16} color="#666" />
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
                      <Box size={16} color="#666" />
                      My Orders
                    </button>
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        navigate('/wishlist')
                      }}
                    >
                      <Heart size={16} color="#666" />
                      My Wishlist
                    </button>
                    <div className="user-menu-divider"></div>
                    {user?.is_admin && (
                      <button
                        type="button"
                        className="user-menu-item"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          navigate('/admin')
                        }}
                      >
                        Admin Panel
                      </button>
                    )}
                    <button className="user-menu-item logout-btn" onClick={handleLogout}>
                      <LogOut size={16} color="#666" />
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

