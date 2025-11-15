import React, { useState } from 'react'
import './ForgotPassword.css'
import '../pages/PasswordStrength.css'
import { estimatePassword } from '../utils/password'
import { api } from '../utils/api'
import { useToast } from '../contexts/ToastContext'

const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const sendOtp = async (e) => {
    e.preventDefault()
    if (!email) return toast.showToast('Please enter your email', 'error')
    setLoading(true)
    try {
      await api.forgotPassword(email)
      toast.showToast('If that email exists, an OTP was sent', 'info')
      setStep(2)
    } catch (err) {
      console.error(err)
      toast.showToast('Failed to send OTP. Try again later.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    if (!otp) return toast.showToast('Enter the OTP', 'error')
    setLoading(true)
    try {
      const res = await api.verifyOtp(email, otp)
      setResetToken(res.reset_token)
      toast.showToast('OTP verified. Enter new password.', 'success')
      setStep(3)
    } catch (err) {
      console.error(err)
      toast.showToast(err?.response?.data?.detail || 'Invalid or expired OTP', 'error')
    } finally {
      setLoading(false)
    }
  }

  const reset = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) return toast.showToast('Fill both password fields', 'error')
    if (newPassword !== confirmPassword) return toast.showToast('Passwords do not match', 'error')
    // require strong password
    const pwEval = estimatePassword(newPassword)
    if (!pwEval.isStrong) return toast.showToast('Please choose a stronger password (12+ chars, mixed case, numbers, symbols).', 'error')
    setLoading(true)
    try {
      await api.resetPassword(resetToken, newPassword)
      toast.showToast('Password changed. Please login.', 'success')
      setStep(1)
      setEmail('')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      toast.showToast(err?.response?.data?.detail || 'Failed to reset password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-card minimal">
            <div className="auth-header small">
              <h1 className="auth-title">Forgot Password</h1>
              <p className="auth-subtitle">Enter your email to receive a one-time code.</p>
            </div>

            {step === 1 && (
              <form onSubmit={sendOtp} className="auth-form">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" required />
                </div>
                <button className="auth-btn" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={verify} className="auth-form">
                <div className="form-group">
                  <label>Enter OTP</label>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" required />
                </div>
                <button className="auth-btn" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={reset} className="auth-form">
                <div className="form-group">
                  <label>New password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required />
                </div>
                <div className="pw-meter">
                  <div className="pw-bars">
                    {[1,2,3,4,5,6].map((i)=>{
                      const cls = i <= estimatePassword(newPassword).score ? `pw-bar fill-${Math.min(i,5)}` : 'pw-bar'
                      return <div key={i} className={cls}></div>
                    })}
                  </div>
                  <div className="pw-label">{estimatePassword(newPassword).label}</div>
                </div>
                <div className="form-group">
                  <label>Confirm password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
                </div>
                <button className="auth-btn" disabled={loading}>{loading ? 'Updating...' : 'Set new password'}</button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
