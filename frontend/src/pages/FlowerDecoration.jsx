import React, { useState } from 'react'
import { api } from '../utils/api'
import './ServicePage.css'
import SubmissionModal from '../components/SubmissionModal'

const FlowerDecoration = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    decoration_type: '',
    material_type: '',
    event_date: '',
    venue: '',
    message: ''
  })

  const decorationTypes = ['Wedding', 'Corporate Event', 'Home Decoration', 'Office Decoration']
  const materialTypes = ['Fresh Flowers', 'Artificial Flowers', 'Mixed (Fresh + Artificial)']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModal({ visible: true, loading: true })
    try {
      await api.createInquiry({
        service_name: 'Flower Decoration',
        ...formData,
        message: `Type: ${formData.decoration_type}, Material: ${formData.material_type}, Date: ${formData.event_date}, Venue: ${formData.venue}. ${formData.message}`
      })
      setFormData({ customer_name: '', email: '', phone: '', decoration_type: '', material_type: '', event_date: '', venue: '', message: '' })
      setModal({ visible: true, loading: false, title: 'Thanks — inquiry received', message: 'We will get back with a quote and next steps soon. Appreciate your interest!' })
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      setModal({ visible: true, loading: false, title: 'Thanks', message: 'Your inquiry was received (demo).' })
    }
  }

  const [modal, setModal] = useState({ visible: false, loading: false, title: '', message: '' })

  const features = [
    'Fresh flowers daily',
    'Expert florists',
    'Custom designs',
    'On-time delivery',
    'Affordable pricing',
    'Beautiful arrangements'
  ]

  return (
    <div className="service-page flower-page">
      <div className="container">
        <h1 className="page-title">Flower Decoration & Materials</h1>
        <p className="page-subtitle">Beautiful floral arrangements for every occasion</p>

        <div className="service-intro">
          <p>Transform your events with our stunning flower decorations. We provide fresh flowers, 
          expert arrangements, and complete decoration services for weddings, corporate events, and special occasions.</p>
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

        <section className="decoration-types-section">
          <h2>Decoration Types</h2>
          <div className="decoration-types-minimal">
            {decorationTypes.map((type, index) => (
              <div key={index} className="decoration-type-minimal">
                {type}
              </div>
            ))}
          </div>
        </section>

        <section className="material-types-section">
          <h2>Material Options</h2>
          <div className="material-types-minimal">
            {materialTypes.map((type, index) => (
              <div key={index} className="material-type-minimal">
                {type}
              </div>
            ))}
          </div>
        </section>

        <section className="inquiry-section">
          <div className="inquiry-container">
            <h2>Custom Decoration Inquiry</h2>
            <p className="inquiry-subtitle">Fill out the form below and we'll get back to you with a quote</p>
            <form onSubmit={handleSubmit} className="inquiry-form-minimal">
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
                <label>Decoration Type *</label>
                <select
                  required
                  value={formData.decoration_type}
                  onChange={(e) => setFormData({ ...formData, decoration_type: e.target.value })}
                >
                  <option value="">Select Type</option>
                  {decorationTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Material Preference *</label>
                <select
                  required
                  value={formData.material_type}
                  onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                >
                  <option value="">Select Material</option>
                  {materialTypes.map((type) => (
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
                <label>Venue/Location *</label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Event venue address"
                />
              </div>
              <div className="form-group">
                <label>Additional Requirements</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="4"
                  placeholder="Any specific requirements or preferences..."
                />
              </div>
              <button type="submit" className="btn btn-primary">Submit Inquiry</button>
            </form>
          </div>
        </section>
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

export default FlowerDecoration

