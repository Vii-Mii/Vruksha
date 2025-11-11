import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { addToCart } from '../utils/cart'
import { Heart, Share2, Layers } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './ProductDetail.css'

const Star = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 .587l3.668 7.431L23.4 9.75l-5.7 5.557L19.6 24 12 19.897 4.4 24l1.9-8.693L.6 9.75l7.732-1.732L12 .587z" fill="#D4AF37"/>
  </svg>
)

const ProductDetail = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(null)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('description')
  const mainImgRef = useRef(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const { user } = useAuth()

  const FilledStar = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 .587l3.668 7.431L23.4 9.75l-5.7 5.557L19.6 24 12 19.897 4.4 24l1.9-8.693L.6 9.75l7.732-1.732L12 .587z" fill="#D4AF37"/>
    </svg>
  )

  const EmptyStar = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" stroke="#ddd" strokeWidth="1" fill="none"/>
    </svg>
  )

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.getProduct(id).then((data) => {
      if (!mounted) return
      // API may return product or 404 — fall back to minimal sample
      const p = data || {
        id,
        name: 'Sample Product',
        price: 999,
        images: ['https://via.placeholder.com/800', 'https://via.placeholder.com/800?2'],
        description: 'A short elegant description about the product that highlights its key details and craftsmanship.',
        tags: ['New', 'Best Seller'],
        specs: { Material: 'Cotton', Size: 'Standard' },
        reviews: []
      }
      // normalize images array
      if (!p.images) p.images = p.image_url ? [p.image_url] : []
      setProduct(p)
      setActiveImage((p.images && p.images[0]) || p.image_url || null)
      // fetch server reviews if available
      ;(async () => {
        try {
          const revs = await api.getProductReviews(id)
          setProduct((pp) => ({ ...pp, reviews: revs }))
        } catch (err) {
          // ignore if endpoint not present
        }
      })()
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to load product', err)
      setLoading(false)
    })
    return () => { mounted = false }
  }, [id])

  // Attempt to flush any pending reviews stored locally (best-effort)
  useEffect(() => {
    const tryFlush = async () => {
      const queue = JSON.parse(localStorage.getItem('pendingReviews') || '[]')
      if (!queue.length) return
      const remaining = []
      for (const item of queue) {
        try {
          await api.createReview(item.productId, item.payload, localStorage.getItem('token'))
        } catch (err) {
          remaining.push(item)
        }
      }
      if (remaining.length === 0) localStorage.removeItem('pendingReviews')
      else localStorage.setItem('pendingReviews', JSON.stringify(remaining))
    }
    tryFlush()
  }, [])

  const changeQty = (delta) => setQty((q) => Math.max(1, q + delta))

  const handleAdd = () => {
    if (!product) return
    addToCart({ ...product, quantity: qty })
    // small, non-blocking feedback
    const prev = document.activeElement
    alert('Added to cart')
    if (prev && prev.focus) prev.focus()
  }

  const openImageWindow = () => {
    if (!activeImage) return
    // open in a new tab/window for larger view
    window.open(activeImage, '_blank', 'noopener,noreferrer')
  }

  const submitReview = async (payload) => {
    const token = localStorage.getItem('token')
    try {
      // send payload with user_name, rating, text
      await api.createReview(id, payload, token)
      // optimistic: append locally with standard shape
      const newRev = { id: null, product_id: Number(id), user_name: payload.user_name, rating: payload.rating, text: payload.text, created_at: new Date().toISOString() }
      setProduct((p) => ({ ...p, reviews: [newRev, ...(p.reviews || [])] }))
      alert('Review submitted')
    } catch (err) {
      console.warn('Failed to submit review; saving locally', err)
      // fallback to localStorage queue
      const queue = JSON.parse(localStorage.getItem('pendingReviews') || '[]')
      queue.push({ productId: id, payload })
      localStorage.setItem('pendingReviews', JSON.stringify(queue))
      // still append to UI
      const newRev = { id: null, product_id: Number(id), user_name: payload.user_name, rating: payload.rating, text: payload.text, created_at: new Date().toISOString() }
      setProduct((p) => ({ ...p, reviews: [newRev, ...(p.reviews || [])] }))
      alert('Saved review locally; it will be submitted when online')
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewText.trim()) return alert('Please enter a short review')
    const payload = { text: reviewText.trim(), rating: reviewRating, user_name: user?.name || 'You' }
    await submitReview(payload)
    setReviewText('')
    setReviewRating(5)
    setShowReviewForm(false)
  }

  const reviews = (product && product.reviews) || []

  return (
    <div className="product-detail-page container">
      <nav className="breadcrumb"><Link to="/">Home</Link> <span>&rsaquo;</span> <Link to={`/${product?.category || 'clothing'}-store`}>{product?.category || 'Store'}</Link> <span>&rsaquo;</span> <span>{product?.name || 'Product'}</span></nav>

      {loading ? (
        <div className="pd-skeleton">
          <div className="s-left" />
          <div className="s-right">
            <div className="s-line short" />
            <div className="s-line" />
            <div className="s-line" />
            <div className="s-box" />
          </div>
        </div>
      ) : (
        product && (
          <div className="pd-grid">
            <div className="pd-images">
              <div
                className="main-image"
                ref={mainImgRef}
                onClick={openImageWindow}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openImageWindow() }}
                aria-label={`Open image of ${product.name} in new window`}
              >
                {activeImage ? (
                  <img src={activeImage} alt={product.name} />
                ) : (
                  <div className="empty-img" />
                )}
              </div>
              <div className="thumbs">
                {(product.images || []).slice(0,5).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`thumb ${src === activeImage ? 'active' : ''}`}
                    onClick={() => setActiveImage(src)}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={src} alt={`${product.name} ${i+1}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="pd-info">
              <h1 className="pd-title">{product.name}</h1>

              <div className="pd-topline">
                <div className="rating">
                  <div className="stars">
                    {[0,1,2,3,4].map((i) => <Star key={i} size={14} />)}
                  </div>
                  <span className="rcount">({reviews.length || 0})</span>
                </div>
                <div className="pd-price">₹{product.price}</div>
              </div>

              <div className="pd-tags">
                {(product.tags || []).slice(0,3).map((t) => (
                  <span className="tag" key={t}>{t}</span>
                ))}
              </div>

              <p className="pd-desc">{product.description}</p>

              <div className="pd-actions">
                <div className="qty">
                  <button className="qty-btn" onClick={() => changeQty(-1)} aria-label="Decrease quantity">-</button>
                  <div className="qty-val">{qty}</div>
                  <button className="qty-btn" onClick={() => changeQty(1)} aria-label="Increase quantity">+</button>
                </div>

                <div className="actions-right">
                  <button className="add-btn" onClick={handleAdd}>Add to Cart</button>
                  <div className="icon-row">
                      <button className="icon-btn" aria-label="Add to wishlist">
                        <Heart size={16} color="#111" />
                      </button>
                      <button className="icon-btn" aria-label="Share product">
                        <Share2 size={16} color="#111" />
                      </button>
                      <button className="icon-btn" aria-label="Compare product">
                        <Layers size={16} color="#111" />
                      </button>
                  </div>
                </div>
              </div>

              <div className="pd-tabs">
                <div className={`tab ${tab==='description' ? 'active' : ''}`} onClick={() => setTab('description')}>Description</div>
                <div className={`tab ${tab==='specs' ? 'active' : ''}`} onClick={() => setTab('specs')}>Specifications</div>
                <div className={`tab ${tab==='reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>Reviews</div>
              </div>

              <div className="tab-content">
                {tab === 'description' && (
                  <div className="tab-panel">
                    <p>{product.long_description || product.description}</p>
                  </div>
                )}
                {tab === 'specs' && (
                  <div className="tab-panel specs">
                    <table>
                      <tbody>
                        {product.specs && Object.entries(product.specs).map(([k,v]) => (
                          <tr key={k}><th>{k}</th><td>{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {tab === 'reviews' && (
                  <div className="tab-panel reviews">
                    <div className="reviews-top">
                      {!showReviewForm && <button className="btn-outline" onClick={() => setShowReviewForm(true)}>Write a Review</button>}
                      {showReviewForm && (
                        <div className="review-form-wrapper">
                          <form className="review-form" onSubmit={handleReviewSubmit}>
                            <div className="review-row">
                              <label className="review-label">Rating</label>
                              <div className="star-picker" role="radiogroup" aria-label="Rating">
                                {[1,2,3,4,5].map((n) => (
                                  <button key={n} type="button" className={`star-btn ${n <= reviewRating ? 'active' : ''}`} onClick={() => setReviewRating(n)} aria-checked={n === reviewRating} role="radio" aria-label={`${n} stars`}>
                                    {n <= reviewRating ? <FilledStar size={16} /> : <EmptyStar size={16} />}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="review-row">
                              <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write a short review" rows={3} maxLength={500} />
                            </div>
                            <div className="review-actions">
                              <button type="submit" className="btn-outline">Submit</button>
                              <button type="button" className="btn-link" onClick={() => { setShowReviewForm(false); setReviewText('') }}>Cancel</button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>

                    <div className="reviews-list">
                      {(reviews.slice(0,50)).map((r, idx) => (
                        <div className="review-card" key={idx}>
                          <div className="rev-head">
                            <div className="rev-avatar">{(r.user && r.user[0]) || (r.user_name && r.user_name[0]) || 'U'}</div>
                            <div className="rev-meta">
                              <div className="rev-author-date">{r.user || r.user_name || 'User'} - <span className="rev-date">{r.date || (r.created_at ? new Date(r.created_at).toLocaleDateString() : '—')}</span></div>
                              <div className="rev-stars">{[0,1,2,3,4].map((i) => (i < (r.rating || 0) ? <FilledStar key={i} size={12} /> : <EmptyStar key={i} size={12} />))}</div>
                            </div>
                          </div>
                          <div className="rev-body">{r.text || 'Lovely product — highly recommended.'}</div>
                        </div>
                      ))}
                    </div>

                    <div className="reviews-actions bottom-actions">
                      {reviews.length > 50 && <button className="btn-link">Load more</button>}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )
      )}
    </div>
  )
}

export default ProductDetail
