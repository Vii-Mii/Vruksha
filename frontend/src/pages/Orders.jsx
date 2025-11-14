import React, { useEffect, useState } from 'react'
import './Orders.css'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const Orders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const data = await api.getUserOrders(token)
        setOrders(data || [])
      } catch (e) {
        console.error('Failed to fetch orders:', e)
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

  const toggle = (id) => setExpanded(prev => (prev === id ? null : id))

  const renderItems = (itemsJson) => {
    let items = []
    try {
      items = JSON.parse(itemsJson || '[]')
    } catch (e) {
      items = []
    }
    if (items.length === 0) return <div className="muted">No item details</div>
    return (
      <div className="order-items-list">
        {items.map((it, idx) => (
          <div key={idx} className="order-item-row">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={(it.images && it.images[0]) || it.selectedImage || 'https://via.placeholder.com/80'} alt={it.name} className="order-item-thumb" />
              <div>
                <strong className="order-item-title">{it.name}</strong>
                <div className="order-item-sub muted">{(it.subcategory || '')} • ₹{it.price}</div>
                {it.selectedColor && (
                  <div style={{ marginTop: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, background: it.selectedColor.hex || '#ccc', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }} />{it.selectedColor.name}</div>
                )}
                {!it.selectedColor && it.variant_color && (
                  <div style={{ marginTop: 6 }}>Color: {it.variant_color}</div>
                )}
              </div>
            </div>
            <div className="order-item-right">
              <div className="order-item-qty">Qty: {it.quantity}</div>
              <div className="order-item-line">₹{(it.price * (it.quantity || 1)).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statusBadge = (o) => {
    if (o.shipment && o.shipment.tracking_number) return <span className="badge badge-green">Shipped</span>
    if (o.shipment) return <span className="badge badge-yellow">In transit</span>
    return <span className="badge badge-gray">Pending</span>
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-card">
          <div className="profile-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Your Orders</h2>
                <p className="muted">A concise history of your purchases</p>
              </div>
              <div className="profile-header-actions">
                <button className="btn btn-ghost compact" style={{ background: 'transparent', border: '1px solid rgba(184,148,31,0.12)', color: '#B8941F' }} onClick={() => navigate('/wishlist')}>My Wishlist</button>
              </div>
            </div>
          </div>

          <div className="profile-body">
            {loading ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <p>You have no orders yet.</p>
            ) : (
              <div className="orders-grid">
                {orders.map((o) => (
                  <div key={o.id} className="order-card" onClick={() => toggle(o.id)}>
                    <div className="order-card-header">
                      <div>
                        <div className="order-number">Order #{o.id}</div>
                        <div className="order-date muted">{new Date(o.created_at || o.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="order-total">₹{o.total_amount}</div>
                        <div style={{ marginTop: 6 }}>{statusBadge(o)}</div>
                      </div>
                    </div>

                    {expanded === o.id && (
                      <div className="order-card-body">
                        <div className="order-details">
                          {renderItems(o.items)}
                        </div>
                        <div className="order-shipment">
                          <h4>Shipment</h4>
                          {o.shipment ? (
                            <div>
                              <div className="muted">Courier: {o.shipment.courier_name || '—'}</div>
                              <div className="muted">Tracking: {o.shipment.tracking_number ? (
                                <a href={`https://www.google.com/search?q=${encodeURIComponent(o.shipment.tracking_number)}`} target="_blank" rel="noreferrer">{o.shipment.tracking_number}</a>
                              ) : '—'}</div>
                              {o.shipment.shipped_at && <div className="muted">Shipped: {new Date(o.shipment.shipped_at).toLocaleString()}</div>}
                            </div>
                          ) : (
                            <div className="muted">Shipment details will appear here once available.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Orders
