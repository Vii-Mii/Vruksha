import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'
import '../pages/PasswordStrength.css'
import { estimatePassword } from '../utils/password'
import TermsModal from '../components/TermsModal'

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [termsOpen, setTermsOpen] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    const pwEval = estimatePassword(formData.password)
    if (!pwEval.isStrong) {
      setError('Please choose a stronger password (use mixed case, numbers and symbols, 12+ chars).')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Update auth context to set token and user
        login(data.user, data.access_token)
        const dest = location?.state?.next || '/'
        navigate(dest)
      } else {
        setError(data.detail || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

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
              <h1 className="auth-title">Join Vruksha</h1>
              <p className="auth-subtitle">Create your account to get started</p>
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
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" stroke="#D4AF37" strokeWidth="1.5"/>
                    <circle cx="12" cy="7" r="4" stroke="#D4AF37" strokeWidth="1.5"/>
                  </svg>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

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
                <label htmlFor="phone">Phone Number</label>
                <div className="input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 16.92V19.92C22 20.51 21.39 21 20.8 21C9.28 21 0 11.72 0 0.2C0 -0.39 0.49 -1 1.08 -1H4.08C4.67 -1 5.16 -0.51 5.16 0.08C5.16 1.25 5.35 2.4 5.72 3.48C5.86 3.82 5.74 4.21 5.41 4.38L3.9 5.13C5.07 7.57 7.43 9.93 9.87 11.1L10.62 9.59C10.79 9.26 11.18 9.14 11.52 9.28C12.6 9.65 13.75 9.84 14.92 9.84C15.51 9.84 16 10.33 16 10.92V13.92C16 14.51 15.51 15 14.92 15C14.92 15 14.92 15 14.92 15" stroke="#D4AF37" strokeWidth="1.5"/>
                  </svg>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Enter your phone number"
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
                    placeholder="Create a password"
                  />
                </div>
                <div className="pw-meter register-gap">
                  <div className="pw-bars">
                    {[1,2,3,4,5,6].map((i)=>{
                      const cls = i <= estimatePassword(formData.password).score ? `pw-bar fill-${Math.min(i,5)}` : 'pw-bar'
                      return <div key={i} className={cls}></div>
                    })}
                  </div>
                  <div className="pw-label">{estimatePassword(formData.password).label}</div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="11" width="18" height="10" rx="2" stroke="#D4AF37" strokeWidth="1.5"/>
                    <path d="M9 16L11 18L15 14" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11" stroke="#D4AF37" strokeWidth="1.5"/>
                  </svg>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-wrapper">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                  <span className="checkmark"></span>
                  I agree to the <button type="button" className="auth-link" onClick={() => setTermsOpen(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Terms & Conditions</button>
                </label>
              </div>

              <button type="submit" className="auth-btn" disabled={loading || !acceptedTerms}>
                {loading ? (
                  <div className="loading-spinner">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} onAccept={() => setAcceptedTerms(true)} />

            <div className="auth-footer">
              <p>Already have an account? <Link to="/login" className="auth-link">Sign in here</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register