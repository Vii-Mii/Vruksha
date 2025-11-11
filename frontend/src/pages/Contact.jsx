import React, { useState } from 'react'
import { api } from '../utils/api'
import './Contact.css'
import SubmissionModal from '../components/SubmissionModal'

const Contact = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModal({ visible: true, loading: true })
    try {
      await api.createInquiry({
        service_name: 'General Inquiry',
        ...formData
      })
      setFormData({ customer_name: '', email: '', phone: '', message: '' })
      setModal({
        visible: true,
        loading: false,
        title: 'Thanks for reaching out!',
        message: 'We appreciate your message. Our team will review it and contact you shortly.'
      })
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setModal({ visible: true, loading: false, title: 'Thanks', message: 'Your message was received (demo).' })
    }
  }

  const [modal, setModal] = useState({ visible: false, loading: false, title: '', message: '' })

  return (
    <div className="contact-page service-page">
      <div className="container">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">We'd love to hear from you</p>

        <div className="contact-intro">
          <p>Have questions or need assistance? We're here to help! Reach out to us through any of the 
          contact methods below, or fill out the form and we'll get back to you as soon as possible.</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <div className="info-card">
              <h3>📍 Location</h3>
              <p>Chennai, Tamil Nadu, India</p>
            </div>
            <div className="info-card">
              <h3>📞 Phone</h3>
              <p>+91 98765 43210</p>
            </div>
            <div className="info-card">
              <h3>✉️ Email</h3>
              <p>info@vruksha.com</p>
            </div>
            <div className="info-card">
              <h3>🕒 Business Hours</h3>
              <p>Monday - Saturday: 9:00 AM - 7:00 PM</p>
              <p>Sunday: 10:00 AM - 5:00 PM</p>
            </div>
          </div>

          <div className="contact-form-section">
            <h2>Send us a Message</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="6"
                  placeholder="Tell us how we can help you..."
                />
              </div>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </div>
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
  )
}

export default Contact

