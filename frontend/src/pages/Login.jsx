import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user, loading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
  setIsSubmitting(true)
    setError('')

    try {
  const response = await fetch(`${BACKEND_ORIGIN.replace(/\/$/, '')}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Update auth context (stores token + user)
        login(data.user, data.access_token)
        // Navigate to intended page (if any) or home
        const dest = location?.state?.next || '/'
        navigate(dest)
      } else {
        setError(data.detail || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // If already logged in, redirect away from login page
  useEffect(() => {
    // Wait for auth provider to finish initialization
  if (loading) return
    if (user) {
      const dest = location?.state?.next || '/'
      navigate(dest, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">
                <div className="vruksha-logo-wrapper">
                  <svg width="60" height="60" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8B4513"/>
                        <stop offset="100%" stopColor="#654321"/>
                      </linearGradient>
                      <linearGradient id="leavesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="white"/>
                        <stop offset="50%" stopColor="#f8f9fa"/>
                        <stop offset="100%" stopColor="white"/>
                      </linearGradient>
                    </defs>
                    
                    <rect x="55" y="70" width="10" height="30" fill="url(#trunkGradient)" rx="3"/>
                    <rect x="53" y="75" width="14" height="4" fill="url(#trunkGradient)" rx="2" opacity="0.6"/>
                    
                    <circle cx="60" cy="50" r="25" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="1"/>
                    <circle cx="45" cy="45" r="18" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.8" opacity="0.9"/>
                    <circle cx="75" cy="45" r="18" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.8" opacity="0.9"/>
                    <circle cx="50" cy="35" r="15" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.6" opacity="0.8"/>
                    <circle cx="70" cy="35" r="15" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.6" opacity="0.8"/>
                    <circle cx="60" cy="25" r="12" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.6" opacity="0.7"/>
                    
                    <path d="M60 70 L45 60 M60 70 L75 60 M60 65 L50 55 M60 65 L70 55" stroke="#D4AF37" strokeWidth="1.5" opacity="0.4"/>
                    
                    <circle cx="40" cy="40" r="3" fill="#D4AF37" opacity="0.6"/>
                    <circle cx="80" cy="40" r="3" fill="#D4AF37" opacity="0.6"/>
                    <circle cx="45" cy="25" r="2.5" fill="#D4AF37" opacity="0.5"/>
                    <circle cx="75" cy="25" r="2.5" fill="#D4AF37" opacity="0.5"/>
                    <circle cx="60" cy="15" r="2" fill="#D4AF37" opacity="0.7"/>
                  </svg>
                </div>
              </div>
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to your Vruksha account</p>
            </div>

            {error && (
              <div className="auth-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#f8d7da"/>
                  <path d="M15 9L9 15M9 9L15 15" stroke="#721c24" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="#D4AF37" strokeWidth="1.5"/>
                    <path d="M22 7L13 13C12.4 13.3 11.6 13.3 11 13L2 7" stroke="#D4AF37" strokeWidth="1.5"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="10" rx="2" stroke="#D4AF37" strokeWidth="1.5"/>
                    <circle cx="12" cy="16" r="1" fill="#D4AF37"/>
                    <path d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11" stroke="#D4AF37" strokeWidth="1.5"/>
                  </svg>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-wrapper">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
              </div>

              <button type="submit" className="auth-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="loading-spinner">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/register" className="auth-link">Sign up here</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login