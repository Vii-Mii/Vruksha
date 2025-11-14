import React, { useEffect, useState, useRef } from 'react'
import { adminApi } from '../utils/api'
import { Bell, Check } from 'lucide-react'

const Notifications = ({ pollInterval = 10000 }) => {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const fetchNotifications = async () => {
    try {
      const data = await adminApi.listNotifications(false)
      setNotifications(data || [])
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, pollInterval)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const ack = async (id) => {
    try {
      await adminApi.ackNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Failed to ack notification', err)
    }
  }

  const unreadCount = notifications.length

  return (
    <div className="notifications-root" ref={ref}>
      <button className="notif-bell" onClick={() => { setOpen(v => !v); if (!open) fetchNotifications() }} title="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Notifications</div>
          <div className="notif-list">
            {notifications.length === 0 && (
              <div className="notif-empty">No new notifications</div>
            )}
            {notifications.map(n => (
              <div key={n.id} className="notif-row">
                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-meta">{n.type} • {new Date(n.created_at || n.createdAt).toLocaleString()}</div>
                </div>
                <div className="notif-actions">
                  <button className="btn-ack" onClick={() => ack(n.id)} title="Acknowledge"><Check size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications
