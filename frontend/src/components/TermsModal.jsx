import React from 'react'
import './TermsModal.css'

export default function TermsModal({ open, onClose, onAccept }) {
  if (!open) return null
  return (
    <div className="tm-backdrop" role="dialog" aria-modal="true">
      <div className="tm-modal">
        <div className="tm-header">
          <h3>Terms & Conditions</h3>
          <button className="tm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="tm-body">
          <p>Welcome to Vruksha. By creating an account you agree to use the service responsibly and in accordance with applicable laws. Keep your credentials confidential. We may send transactional emails (order confirmations, service updates) to the email you provide.</p>
          <p>Short, clear points:</p>
          <ul>
            <li>Do not share your account credentials.</li>
            <li>Respect other users and follow our content guidelines.</li>
            <li>We reserve the right to suspend accounts that violate terms.</li>
            <li>Orders and bookings are subject to their specific cancellation policies.</li>
          </ul>
          <p>If you need the full legal text, contact support at support@vruksha.example or visit our website.</p>
        </div>
        <div className="tm-actions">
          <button className="btn tm-accept" onClick={() => { onAccept(); onClose(); }}>I Agree</button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
