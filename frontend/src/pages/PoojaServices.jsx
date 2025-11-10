import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, cartApi } from '../utils/api'
import { addToCart, getCart } from '../utils/cart'
import { useAuth } from '../contexts/AuthContext'
import './PoojaServices.css'

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
    'Griha Pravesh (House Warming)',
    'Satyanarayana Pooja',
    'Lakshmi Pooja',
    'Ganapathi Homam',
    'Navagraha Pooja',
    'Wedding Pooja'
  ]

  const handleAddToCart = (product) => {
    addToCart({ ...product, quantity: 1 })
    alert('Item added to cart!')
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
    try {
      await api.createBooking({
        service_name: 'Pooja Service',
        ...formData
      })
      alert('Your pooja booking has been submitted! We will contact you soon.')
      setFormData({
        customer_name: '',
        email: '',
        phone: '',
        pooja_type: '',
        date: '',
        message: ''
      })
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Booking submitted! (Demo mode)')
    }
  }

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
                    <div className="product-image">
                      <img src={product.image_url || 'https://via.placeholder.com/300'} alt={product.name} />
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <div className="product-footer">
                        <span className="price">₹{product.price}</span>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Cart
                        </button>
                      </div>
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
              <div className="pooja-list">
                {poojaTypes.map((type, index) => (
                  <div key={index} className="pooja-type-card">
                    <div className="icon">{type.split(' ')[0].slice(0,2).toUpperCase()}</div>
                    <div>
                      <h3>{type}</h3>
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
                      <option key={type} value={type}>{type}</option>
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
      </div>
    </div>
  )
}

export default PoojaServices

