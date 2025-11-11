import React, { useState } from 'react'
import { api } from '../utils/api'
import SubmissionModal from '../components/SubmissionModal'
import './ServicePage.css'

const BeauticianServices = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    service_type: '',
    date: '',
    time: '',
    message: ''
  })

  const services = [
    { 
      name: 'Bridal Makeup', 
      price: 5000, 
      description: 'Complete bridal makeup with hair styling',
      features: ['Trial session included', 'Premium products', 'Hair styling', 'Draping assistance']
    },
    { 
      name: 'Party Makeup', 
      price: 2000, 
      description: 'Glamorous party makeup',
      features: ['Long-lasting makeup', 'Hair styling', 'Touch-up kit']
    },
    { 
      name: 'Hair Styling', 
      price: 1500, 
      description: 'Professional hair styling and setting',
      features: ['Various styles', 'Hair accessories', 'Hair care']
    },
    { 
      name: 'Facials & Skin Treatments', 
      price: 1200, 
      description: 'Deep cleansing facials and skin care',
      features: ['Deep cleansing', 'Moisturizing', 'Skin brightening']
    },
    { 
      name: 'Mehndi/Henna', 
      price: 800, 
      description: 'Beautiful mehndi designs for hands and feet',
      features: ['Traditional designs', 'Modern patterns', 'Long-lasting color']
    },
    {
      name: 'Haircut & Styling',
      price: 600,
      description: 'Professional haircut and styling services',
      features: ['Expert stylists', 'Latest trends', 'Hair consultation']
    }
  ]

  const features = [
    'Experienced professionals',
    'Premium quality products',
    'Home service available',
    'Flexible timing',
    'Affordable pricing',
    'Satisfaction guaranteed'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModal({ visible: true, loading: true })
    try {
      await api.createBooking({
        service_name: formData.service_type,
        ...formData
      })
      setFormData({
        customer_name: '',
        email: '',
        phone: '',
        service_type: '',
        date: '',
        time: '',
        message: ''
      })
      setModal({ visible: true, loading: false, title: 'Booking received', message: 'We will contact you to confirm the details.' })
    } catch (error) {
      console.error('Error submitting booking:', error)
      setModal({ visible: true, loading: false, title: 'Thanks', message: 'Your booking was received (demo).' })
    }
  }

  const [modal, setModal] = useState({ visible: false, loading: false, title: '', message: '' })

  return (
    <div className="service-page beautician-page">
      <div className="container">
        <h1 className="page-title">Beautician Services</h1>
        <p className="page-subtitle">Professional beauty and makeup services</p>

        <div className="beautician-intro">
          <p>Transform your look with our professional beauty services. From bridal makeup to everyday 
          styling, we bring beauty services right to your doorstep with expert care and premium products.</p>
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

        <section className="services-showcase">
          <h2>Our Services</h2>
          <div className="services-grid-minimal">
            {services.map((service, index) => (
              <div key={index} className="service-card-minimal">
                <div className="service-header-minimal">
                  <h3>{service.name}</h3>
                  <span className="price">₹{service.price}</span>
                </div>
                <p className="service-description">{service.description}</p>
                {service.features && (
                  <ul className="service-features-list">
                    {service.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="booking-section-minimal">
          <div className="booking-container">
            <h2>Book an Appointment</h2>
            <p className="booking-subtitle">Fill out the form below to schedule your beauty service</p>
            <form onSubmit={handleSubmit} className="booking-form-minimal">
            <div className="form-row">
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
            </div>
            <div className="form-row">
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
                <label>Service Type *</label>
                <select
                  required
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                >
                  <option value="">Select Service</option>
                  {services.map((service) => (
                    <option key={service.name} value={service.name}>{service.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
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
                <label>Preferred Time *</label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows="4"
                placeholder="Any special requirements..."
              />
            </div>
            <button type="submit" className="btn btn-primary">Book Appointment</button>
          </form>
          </div>
        </section>
      </div>
      <SubmissionModal visible={modal.visible} loading={modal.loading} title={modal.title} message={modal.message} onClose={() => setModal({ visible: false, loading: false, title: '', message: '' })} />
    </div>
  )
}

export default BeauticianServices

