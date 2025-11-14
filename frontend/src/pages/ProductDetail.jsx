import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { addToCart } from '../utils/cart'
import { Heart, Share2, Layers } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
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
  const [availableColors, setAvailableColors] = useState([])
  const [selectedColor, setSelectedColor] = useState(null)
  const [variants, setVariants] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('description')
  const mainImgRef = useRef(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
    const { user } = useAuth()
    const toast = useToast()

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
  if (!p.images) p.images = []

      // Prefer modern `variants` model (variants: [{id, color, color_code, images: [], sizes: []}])
      if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
        setVariants(p.variants)
        setSelectedVariant(p.variants[0])
        setSelectedSize((p.variants[0].sizes && p.variants[0].sizes[0] && p.variants[0].sizes[0].size) || null)
        setAvailableColors(p.variants.map(v => ({ name: v.color, hex: v.color_code, images: v.images })))
        setSelectedColor({ name: p.variants[0].color, hex: p.variants[0].color_code, images: p.variants[0].images })
  setActiveImage((p.variants[0].images && p.variants[0].images[0]) || p.images[0] || null)
      } else {
        // If product has colors (legacy), normalize structure:
        // product.colors = [{ name: 'Red', hex: '#ff0000', images: [...] }, ...]
        if (p.category === 'clothing' && !p.colors) {
          // attempt to infer a single default color from main image
          p.colors = null
        }
      }

      setProduct(p)
      // If colors provided, use first color's first image as active image
      if (!p.variants || p.variants.length === 0) {
          if (p.colors && Array.isArray(p.colors) && p.colors.length > 0) {
          setAvailableColors(p.colors)
          setSelectedColor(p.colors[0])
          setActiveImage((p.colors[0].images && p.colors[0].images[0]) || p.images[0] || null)
        } else {
          setAvailableColors([])
          setSelectedColor(null)
          setActiveImage((p.images && p.images[0]) || null)
        }
      }
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
    const payload = { ...product, quantity: qty }
    if (selectedColor) payload.selectedColor = { name: selectedColor.name, hex: selectedColor.hex }
    if (activeImage) payload.selectedImage = activeImage
    if (selectedVariant) {
      payload.variant_id = selectedVariant.id
      payload.variant_color = selectedVariant.color
      // if sizes exist, prefer the UI-selected size; fallback to first size
      if (selectedVariant.sizes && selectedVariant.sizes.length > 0) {
        payload.selectedSize = selectedSize || (selectedVariant.sizes[0] && selectedVariant.sizes[0].size) || null
      }
    }
    addToCart(payload)
    // small, non-blocking feedback
    const prev = document.activeElement
    toast.showToast('Added to cart', 'success')
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
  toast.showToast('Review submitted', 'success')
    } catch (err) {
      console.warn('Failed to submit review; saving locally', err)
      // fallback to localStorage queue
      const queue = JSON.parse(localStorage.getItem('pendingReviews') || '[]')
      queue.push({ productId: id, payload })
      localStorage.setItem('pendingReviews', JSON.stringify(queue))
      // still append to UI
      const newRev = { id: null, product_id: Number(id), user_name: payload.user_name, rating: payload.rating, text: payload.text, created_at: new Date().toISOString() }
  setProduct((p) => ({ ...p, reviews: [newRev, ...(p.reviews || [])] }))
  toast.showToast('Saved review locally; it will be submitted when online', 'info')
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
  if (!reviewText.trim()) return toast.showToast('Please enter a short review', 'info')
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
                {((selectedVariant && selectedVariant.images) ? selectedVariant.images : ((selectedColor && selectedColor.images) ? selectedColor.images : (product.images || []))).slice(0,5).map((src, i) => (
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

              {/* Color selector shown first (full-width) - show whenever availableColors populated */}
              {availableColors && availableColors.length > 0 && (
                <div className="color-selector-block">
                  <label className="color-label">Color</label>
                  <div className="swatches" role="list">
                    {availableColors.map((c, idx) => (
                      <button
                        key={c.name + idx}
                        type="button"
                        className={`swatch ${selectedColor && selectedColor.name === c.name ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedColor(c)
                            if (variants && variants.length) {
                              const v = variants.find((vv) => vv.color === c.name)
                              if (v) {
                                setSelectedVariant(v)
                                setSelectedSize((v.sizes && v.sizes[0] && v.sizes[0].size) || null)
                              } else {
                                setSelectedVariant(null)
                                setSelectedSize(null)
                              }
                              const img = (v && v.images && v.images[0]) || (c.images && c.images[0]) || (product.images && product.images[0])
                              setActiveImage(img)
                            } else {
                              const img = (c.images && c.images[0]) || (product.images && product.images[0])
                              setActiveImage(img)
                              setSelectedVariant(null)
                              setSelectedSize(null)
                            }
                          }}
                        style={{ borderColor: selectedColor && selectedColor.name === c.name ? 'rgba(212,175,55,0.9)' : undefined }}
                        aria-label={`Select color ${c.name}`}
                      >
                        <span className="swatch-circle" style={{ background: c.hex || '#ccc' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector (shows when variant has sizes) */}
              {selectedVariant && selectedVariant.sizes && selectedVariant.sizes.length > 0 && (
                <div className="size-selector">
                  <label className="size-label">Size</label>
                  <div className="sizes" role="list">
                    {selectedVariant.sizes.map((s, idx) => (
                      <button
                        key={s.size + idx}
                        type="button"
                        className={`size-btn ${selectedSize === s.size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(s.size)}
                        aria-label={`Select size ${s.size}`}
                      >
                        {s.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pd-actions">
                <div className="qty">
                  <button className="qty-btn" onClick={() => changeQty(-1)} aria-label="Decrease quantity">-</button>
                  <div className="qty-val">{qty}</div>
                  <button className="qty-btn" onClick={() => changeQty(1)} aria-label="Increase quantity">+</button>
                </div>

                <div className="actions-right">
                  <button className="add-btn" onClick={() => handleAdd()}>Add to Cart</button>
                  <div className="icon-row">
                      <button className="icon-btn" aria-label="Add to wishlist" onClick={async () => {
                        try {
                          const token = localStorage.getItem('token')
                          if (!token) return toast.showToast('Please login to use wishlist', 'info')
                          // toggle: if already in wishlist, remove; otherwise add
                          if (product && product.id) {
                            // Try to add to wishlist (backend will avoid dupes)
                            await api.addToWishlist({ id: product.id, name: product.name, price: product.price }, token)
                              toast.showToast('Added to wishlist', 'success')
                          }
                        } catch (err) {
                          console.error('Wishlist add error', err)
                            toast.showToast('Could not update wishlist', 'error')
  toast.showToast('Review submitted', 'success')
  toast.showToast('Saved review locally; it will be submitted when online', 'info')
  if (!reviewText.trim()) return toast.showToast('Please enter a short review', 'info')
                        }
                      }}>
                        <Heart size={16} color="#111" />
                      </button>
                      <button className="icon-btn" aria-label="Share product" onClick={async () => {
                        try {
                          const url = window.location.href
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(url)
                            toast.showToast('Product link copied to clipboard', 'success')
                          } else {
                            // fallback: create a temporary input
                            const tmp = document.createElement('input')
                            tmp.style.position = 'absolute'
                            tmp.style.left = '-9999px'
                            tmp.value = url
                            document.body.appendChild(tmp)
                            tmp.select()
                            try {
                              document.execCommand('copy')
                              toast.showToast('Product link copied to clipboard', 'success')
                            } catch (err) {
                              toast.showToast('Could not copy link; please copy manually', 'error')
                            }
                            document.body.removeChild(tmp)
                          }
                        } catch (err) {
                          console.error('Clipboard copy failed', err)
                          toast.showToast('Could not copy link', 'error')
                        }
                      }}>
                        <Share2 size={16} color="#111" />
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
