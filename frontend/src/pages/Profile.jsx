import React, { useState } from 'react'
import './Profile.css'
import { useAuth } from '../contexts/AuthContext'

const Profile = () => {
  const { user, updateUserProfile } = useAuth()
  const [editing, setEditing] = useState(false)

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || ''
  })

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-card">
            <h2>Please sign in to view your profile</h2>
          </div>
        </div>
      </div>
    )
  }

  const handleSave = (e) => {
    e.preventDefault()
    updateUserProfile(form)
    setEditing(false)
    alert('Profile updated locally. These values will prefill checkout.')
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" fill="#D4AF37" />
                <path d="M4 20C4 16 8 14 12 14C16 14 20 16 20 20" fill="#F4D03F" />
              </svg>
            </div>
            <div className="profile-info">
              <h2>{user.name}</h2>
              <p className="muted">{user.email}</p>
            </div>
          </div>

          <div className="profile-body">
            {!editing ? (
              <>
                <div className="profile-row">
                  <div className="label">Phone</div>
                  <div className="value">{user.phone || '-'}</div>
                </div>
                <div className="profile-row">
                  <div className="label">Address</div>
                  <div className="value">{user.address || '-'}</div>
                </div>
                <div className="profile-row">
                  <div className="label">City</div>
                  <div className="value">{user.city || '-'}</div>
                </div>
                <div className="profile-row">
                  <div className="label">State</div>
                  <div className="value">{user.state || '-'}</div>
                </div>
                <div className="profile-row">
                  <div className="label">Pincode</div>
                  <div className="value">{user.pincode || '-'}</div>
                </div>
                <div className="profile-actions">
                  <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSave} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="btn btn-primary" type="submit">Save</button>
                  <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
