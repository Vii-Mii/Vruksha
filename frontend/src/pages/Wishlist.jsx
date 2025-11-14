import React, { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import './Wishlist.css'

const Wishlist = () => {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      try {
        const data = await api.getWishlist(token)
        setItems(data || [])
      } catch (err) {
        console.error('Failed to load wishlist', err)
      }
    }
    load()
  }, [user])

  const handleRemove = async (id) => {
    const token = localStorage.getItem('token')
    // optimistic UI: remove locally first
    const previous = items
    setItems((s) => s.filter((i) => (i.id || i) !== id))
    try {
      await api.removeFromWishlist(id, token)
    } catch (err) {
      console.error('Failed to remove wishlist item', err)
      // rollback
      setItems(previous)
      alert('Could not remove item')
    }
  }

  if (!user) {
    return (<div className="container"><h2>Please login to view your wishlist</h2></div>)
  }

  return (
    <div className="wishlist-page container">
      <h1>My Wishlist</h1>
      {items.length === 0 ? (
        <div>
          <p>Your wishlist is empty.</p>
          <Link to="/clothing-store" className="btn btn-primary">Shop now</Link>
        </div>
      ) : (
        <div className="wishlist-admin-list">
          {items.map((it, idx) => {
            const id = it.id || it
            return (
              <div key={id || idx} className="admin-product-row">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={(it.image_url || (it.images && it.images[0]) || it.selectedImage) || 'https://via.placeholder.com/80'} alt={it.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                  <div>
                    <strong>{it.name}</strong>
                    <div style={{ color: '#666', fontSize: 13 }}>{(it.subcategory || it.category || '')} • ₹{(Number(it.price || 0)).toFixed(2)}</div>
                    <div style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>{(it.description || it.short_description || it.summary || '').slice(0,140)}{(it.description && it.description.length > 140) ? '...' : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/product/${id}`} className="btn btn-ghost compact">View</Link>
                  <button className="btn btn-danger compact" onClick={() => handleRemove(id)}>Remove</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Wishlist
