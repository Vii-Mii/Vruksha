import React, { createContext, useCallback, useContext, useState } from 'react'
import '../components/Toast.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 2500) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, duration)
  }, [])

  const contextValue = { showToast }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-wrapper" aria-live="polite">
        {toasts.map((to) => (
          <div key={to.id} className={`toast ${to.type}`}>
            {to.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastContext
