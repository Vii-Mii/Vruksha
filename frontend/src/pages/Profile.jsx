import React from 'react'
import './Profile.css'
import { useAuth } from '../contexts/AuthContext'

const Profile = () => {
  const { user } = useAuth()

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
            <div className="profile-row">
              <div className="label">Phone</div>
              <div className="value">{user.phone || '-'}</div>
            </div>
            <div className="profile-row">
              <div className="label">Account Created</div>
              <div className="value">{new Date(user.created_at || user.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>

            <div className="profile-actions">
              <button className="btn btn-primary">Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
