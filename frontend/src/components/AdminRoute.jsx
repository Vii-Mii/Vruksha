import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const [status, setStatus] = useState('checking') // 'checking' | 'allowed' | 'denied'

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      // Wait until auth provider finishes initial load
      if (loading) return

      // Build effectiveUser from context or localStorage
      let effectiveUser = user
      if (!effectiveUser) {
        try {
          const s = localStorage.getItem('user')
          if (s) effectiveUser = JSON.parse(s)
        } catch (err) {
          effectiveUser = null
        }
      }

      const hasAdmin = (u) => {
        if (!u) return false
        const v = u.is_admin
        return v === true || v === 1 || v === '1' || v === 'true'
      }

      if (hasAdmin(effectiveUser)) {
        if (!cancelled) setStatus('allowed')
        return
      }

      // If we have a token, ask the server for the authoritative /me
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const resp = await fetch('http://localhost:8000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          if (resp.ok) {
            const data = await resp.json()
            // store refreshed user
            localStorage.setItem('user', JSON.stringify(data))
            if (hasAdmin(data)) {
              if (!cancelled) setStatus('allowed')
              return
            }
          }
        } catch (err) {
          // ignore network errors
          console.error('AdminRoute: failed to verify /api/auth/me', err)
        }
      }

      if (!cancelled) setStatus('denied')
    }

    check()
    return () => { cancelled = true }
  }, [loading, user])

  if (status === 'checking') return null
  if (status === 'denied') return <Navigate to="/" replace />
  return children
}

export default AdminRoute
