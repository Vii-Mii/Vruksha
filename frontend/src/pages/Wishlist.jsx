import React, { useEffect, useState } from 'react'
import { api, BACKEND_ORIGIN } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Link } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import './Wishlist.css'

const Wishlist = () => {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      try {
        const data = await api.getWishlist(token)
        const resolved = await Promise.all((data || []).map(async (it) => {
          // If wishlist stores just an id or a primitive, fetch product details
          const id = (typeof it === 'number' || typeof it === 'string') ? it : (it && (it.id || it.product_id))
          if (id && (!it || (typeof it !== 'object') || (!it.image_url && !(it.images && it.images.length) && !it.selectedImage))) {
            try {
              const p = await api.getProduct(id)
              // keep original object shape if it was an object, but favor product fields
              return { ...(typeof it === 'object' ? it : {}), id: p.id, name: p.name, price: p.price, description: p.description, images: p.images || [] }
            } catch (err) {
              // failed to fetch product; return original
              return it
            }
          }
          return it
        }))
        setItems(resolved || [])
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
      toast.showToast('Could not remove item', 'error')
    }
  }

  if (!user) {
    return (<div className="container"><h2>Please login to view your wishlist</h2></div>)
  }

  return (
    <div className="wishlist-page container">
      <h1>My Wishlist</h1>
      <p className="wishlist-quote" style={{ textAlign: 'center', marginTop: 6 }}>
        "Collect what you love — curate a little list of things that make you smile."
      </p>
      {items.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty-card">
            <p className="muted" style={{ marginTop: 8 }}>Your wishlist is empty. Start exploring to add treasures.</p>
            <Link to="/clothing-store" className="btn btn-ghost compact" style={{ background: 'transparent', border: '1px solid rgba(184,148,31,0.12)', color: '#B8941F', marginTop: 14 }}>Shop now</Link>
          </div>
        </div>
      ) : (
        <div className="wishlist-admin-list">
          {items.map((it, idx) => {
            const id = it.id || it
            return (
              <div key={id || idx} className="admin-product-row">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={(function(){
                    let raw = (it.image_url || (it.images && it.images[0]) || it.selectedImage)
                    if (!raw) return 'https://via.placeholder.com/80'
                    // Normalize leading static path variants
                    if (raw.startsWith('/static/')) return `${BACKEND_ORIGIN}${raw}`
                    if (raw.startsWith('static/')) return `${BACKEND_ORIGIN}/${raw}`
                    return raw
                  })()} alt={it.name || 'Product'} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
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
