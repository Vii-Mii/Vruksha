import React from 'react'
import './SubmissionModal.css'

const SubmissionModal = ({ visible, loading, title, message, onClose }) => {
  if (!visible) return null
  return (
    <div className="submission-backdrop">
      <div className="submission-modal">
        {loading ? (
          <div className="submission-loading">
            <div className="spinner" />
            <div className="loading-text">Submitting…</div>
          </div>
        ) : (
          <div className="submission-success">
            <div className="check">✓</div>
            <h3>{title || 'Thank you'}</h3>
            <p>{message || 'We have received your request. We will be in touch soon.'}</p>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubmissionModal
