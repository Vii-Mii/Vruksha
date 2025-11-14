import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, cartApi } from '../utils/api'
import { addToCart, getCart } from '../utils/cart'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import './PoojaServices.css'
import SubmissionModal from '../components/SubmissionModal'

const PoojaServices = () => {
  const [products, setProducts] = useState([])
  const [activeTab, setActiveTab] = useState('store')
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    pooja_type: '',
    date: '',
    message: ''
  })
  const auth = useAuth()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts('pooja_items')
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      }
    }
    fetchProducts()
  }, [])

  const poojaTypes = [
    {
      name: 'Griha Pravesh (House Warming)',
      desc: 'Bless your new home with traditional rituals and offerings.'
    },
    { name: 'Satyanarayana Pooja', desc: 'A simple, powerful ritual for prosperity and gratitude.' },
    { name: 'Lakshmi Pooja', desc: 'Invoke the blessings of Lakshmi for wealth and well-being.' },
    { name: 'Ganapathi Homam', desc: 'A homam to remove obstacles and seek auspicious beginnings.' },
  { name: 'Navagraha Pooja', desc: 'Rituals focused on balancing the nine planetary influences.' },
    { name: 'Wedding Pooja', desc: 'Ceremonies and rituals to sanctify wedding occasions.' }
  ]

  const toast = useToast()
  const handleAddToCart = (product) => {
    addToCart({ ...product, quantity: 1 })
    toast.showToast('Item added to cart!', 'success')
    if (auth && auth.token) {
      ;(async () => {
        try {
          const items = getCart()
          await cartApi.setCart(items, auth.token)
        } catch (err) {
          console.error('Failed to sync cart to server:', err)
        }
      })()
    }
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setModal({ visible: true, loading: true })
    try {
      await api.createBooking({
        service_name: 'Pooja Service',
        ...formData
      })
      setFormData({
        customer_name: '',
        email: '',
        phone: '',
        pooja_type: '',
        date: '',
        message: ''
      })
      setModal({ visible: true, loading: false, title: 'Booking received', message: 'We will contact you soon.' })
    } catch (error) {
      console.error('Error submitting booking:', error)
      setModal({ visible: true, loading: false, title: 'Thanks', message: 'Your booking was received (demo).' })
    }
  }

  const [modal, setModal] = useState({ visible: false, loading: false, title: '', message: '' })

  const features = [
    'Authentic pooja items',
    'Experienced pandits',
    'Complete pooja kits',
    'Home delivery available',
    'Customized services',
    'Affordable pricing'
  ]

  return (
    <div className="pooja-page service-page">
      <div className="container">
        <h1 className="page-title">Pooja Items & Services</h1>
        <p className="page-subtitle">Complete pooja solutions for your spiritual needs</p>

        <div className="service-intro">
          <p>We offer a complete range of pooja items and professional pooja services. From authentic idols 
          and incense to experienced pandits for all your spiritual ceremonies, we provide everything you need 
          for your religious rituals.</p>
        </div>

        <section className="features-section">
          <h2>Why Choose Us</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-item">
                <span className="feature-icon">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            Pooja Items Store
          </button>
          <button
            className={`tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Pooja Services
          </button>
        </div>

        {activeTab === 'store' && (
          <div className="store-section">
            <div className="products-grid">
              {products.length > 0 ? (
                products.map((product) => (
                  <div key={product.id} className="product-card card compact-card">
                    <Link to={`/product/${product.id}`} className="product-link">
                      <div className="product-image">
                        <img src={(product.images && product.images[0]) || 'https://via.placeholder.com/300'} alt={product.name} />
                      </div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="product-description">{product.description}</p>
                        <div className="product-footer">
                          <span className="price">₹{product.price}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="product-footer">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-products">
                  <p>No products available. Check back soon!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="services-section">
            <div className="pooja-types">
              <h2>Types of Poojas Offered</h2>
              <div className="pooja-list minimal-grid">
                {poojaTypes.map((type, index) => (
                  <div key={index} className="pooja-type-card minimal">
                    <div className="pooja-icon" aria-hidden="true">
                      {/* simple diya svg */}
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C12 2 9.8 5 12 7C14.2 5 12 2 12 2Z" fill="#F7C948" />
                        <path d="M3 13C3 13 6 11 12 11C18 11 21 13 21 13C20 17 16 20 12 20C8 20 4 17 3 13Z" fill="#D98E04" />
                        <path d="M7 13C7 13 9 9 12 9C15 9 17 13 17 13" stroke="#C76B00" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="pooja-content">
                      <h3>{type.name}</h3>
                      <p className="pooja-desc">{type.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="booking-section">
              <h2>Book a Pooja Service</h2>
              <form onSubmit={handleBookingSubmit} className="booking-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Pooja Type *</label>
                  <select
                    required
                    value={formData.pooja_type}
                    onChange={(e) => setFormData({ ...formData, pooja_type: e.target.value })}
                  >
                    <option value="">Select Pooja Type</option>
                    {poojaTypes.map((type) => (
                      <option key={type.name} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Additional Requirements</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows="4"
                    placeholder="Any special requirements or items needed..."
                  />
                </div>
                <button type="submit" className="btn btn-primary">Book Pooja Service</button>
              </form>
            </div>
          </div>
        )}
        {modal.visible && (
          <SubmissionModal
            visible={modal.visible}
            loading={modal.loading}
            title={modal.title}
            message={modal.message}
            onClose={() => setModal({ visible: false, loading: false, title: '', message: '' })}
          />
        )}
      </div>
    </div>
  )
}

export default PoojaServices

