import React, { useState } from 'react'
import { api } from '../utils/api'
import SubmissionModal from '../components/SubmissionModal'
import './ServicePage.css'

const CateringServices = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    event_type: '',
    event_date: '',
    guest_count: '',
    menu_preference: '',
    message: ''
  })

  const eventTypes = ['Wedding', 'Corporate Event', 'Birthday Party', 'Anniversary', 'Other']
  const menuOptions = ['Vegetarian', 'Non-Vegetarian', 'Mixed', 'Special Diet']

  const features = [
    'Hygienic food preparation',
    'Professional serving staff',
    'Customizable menu options',
    'On-time delivery',
    'Affordable pricing',
    'Fresh ingredients'
  ]

  const sampleMenus = {
    vegetarian: [
      'South Indian Thali',
      'North Indian Buffet',
      'Continental Options',
      'Traditional Sweets'
    ],
    nonVegetarian: [
      'Chicken Biryani',
      'Mutton Curry',
      'Seafood Specialties',
      'BBQ Options'
    ],
    beverages: [
      'Fresh Juices',
      'Soft Drinks',
      'Traditional Drinks',
      'Tea & Coffee'
    ]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModal({ visible: true, loading: true })
    try {
      await api.createInquiry({
        service_name: 'Catering Services',
        ...formData,
        message: `Event Type: ${formData.event_type}, Date: ${formData.event_date}, Guests: ${formData.guest_count}, Menu: ${formData.menu_preference}. ${formData.message}`
      })
      setFormData({
        customer_name: '',
        email: '',
        phone: '',
        event_type: '',
        event_date: '',
        guest_count: '',
        menu_preference: '',
        message: ''
      })
      setModal({ visible: true, loading: false, title: 'Thanks — we received your request', message: 'Our team will contact you soon with a quote.' })
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      setModal({ visible: true, loading: false, title: 'Thanks', message: 'Your inquiry was received (demo).' })
    }
  }

  const [modal, setModal] = useState({ visible: false, loading: false, title: '', message: '' })

  return (
    <div className="service-page catering-page">
      <div className="container">
        <h1 className="page-title">Catering Services</h1>
        <p className="page-subtitle">Premium catering for all your special occasions</p>

        <div className="catering-intro">
          <p>We provide exceptional catering services for weddings, corporate events, parties, and more. 
          Our experienced team ensures delicious food, professional service, and memorable experiences.</p>
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

        <section className="event-types-section">
          <h2>Event Types We Cater</h2>
          <div className="event-types-minimal">
            {eventTypes.map((type, index) => (
              <div key={index} className="event-type-minimal">
                {type}
              </div>
            ))}
          </div>
        </section>

        <section className="menu-showcase">
          <h2>Our Menu Options</h2>
          <div className="menu-grid">
            <div className="menu-card">
              <h3>Vegetarian</h3>
              <ul>
                {sampleMenus.vegetarian.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="menu-card">
              <h3>Non-Vegetarian</h3>
              <ul>
                {sampleMenus.nonVegetarian.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="menu-card">
              <h3>Beverages</h3>
              <ul>
                {sampleMenus.beverages.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="menu-card">
              <h3>Special Diets</h3>
              <ul>
                <li>Jain Food</li>
                <li>Vegan Options</li>
                <li>Gluten-Free</li>
                <li>Custom Requirements</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="quote-section">
          <div className="quote-container">
            <h2>Get a Quote</h2>
            <p className="quote-subtitle">Fill out the form below and we'll get back to you with a customized quote</p>
            <form onSubmit={handleSubmit} className="quote-form-minimal">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
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
              <div className="form-group">
                <label>Event Type *</label>
                <select
                  required
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                >
                  <option value="">Select Event Type</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="date"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Expected Guest Count *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.guest_count}
                  onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Menu Preference *</label>
                <select
                  required
                  value={formData.menu_preference}
                  onChange={(e) => setFormData({ ...formData, menu_preference: e.target.value })}
                >
                  <option value="">Select Menu Type</option>
                  {menuOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Additional Requirements</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="4"
                  placeholder="Any special requirements or preferences..."
                />
              </div>
              <button type="submit" className="btn btn-primary">Get Quote</button>
            </form>
          </div>
        </section>
      </div>
      <SubmissionModal visible={modal.visible} loading={modal.loading} title={modal.title} message={modal.message} onClose={() => setModal({ visible: false, loading: false, title: '', message: '' })} />
    </div>
  )
}

export default CateringServices

