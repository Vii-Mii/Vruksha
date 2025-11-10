import React, { useEffect, useState } from 'react'
import './Profile.css'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const Orders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const data = await api.getUserOrders(token)
        console.log('Fetched orders:', data)
        setOrders(data)
      } catch (e) {
        console.error('Failed to fetch orders:', e)
        // If unauthorized, navigate to login so user can re-authenticate
        if (e.response && e.response.status === 401) {
          navigate('/login', { state: { next: '/orders' } })
        }
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchOrders()
  }, [user, navigate])

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-card">
            <h2>Please sign in to view your orders</h2>
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
            <h2>Your Orders</h2>
            <p className="muted">Orders placed with Vruksha</p>
          </div>

          <div className="profile-body">
            {loading ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <p>You have no orders yet.</p>
            ) : (
              <div className="orders-list">
                {orders.map((o) => {
                  let parsedItems = []
                  try {
                    parsedItems = JSON.parse(o.items || '[]')
                  } catch (e) {
                    parsedItems = []
                  }

                  return (
                    <div key={o.id} className="order-row">
                      <div className="order-left">
                        <div className="order-id">Order #{o.id}</div>
                        <div className="order-date">{new Date(o.created_at || o.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="order-right">
                        <div className="order-total">₹{o.total_amount}</div>
                        <div className="order-items muted">
                          {parsedItems.length === 0 ? (
                            <em>No item details</em>
                          ) : (
                            <ul className="order-item-list">
                              {parsedItems.map((it, idx) => (
                                <li key={idx}>{it.name} × {it.quantity}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {o.shipment && (
                          <div className="order-shipment" style={{ marginTop: 10 }}>
                            <strong>Shipment:</strong>
                            <div className="muted">Courier: {o.shipment.courier_name || '—'}</div>
                            <div className="muted">Tracking: {o.shipment.tracking_number ? (
                              <a href={`https://www.google.com/search?q=${encodeURIComponent(o.shipment.tracking_number)}`} target="_blank" rel="noreferrer">{o.shipment.tracking_number}</a>
                            ) : '—'}</div>
                            {o.shipment.shipped_at && <div className="muted">Shipped: {new Date(o.shipment.shipped_at).toLocaleString()}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Orders
