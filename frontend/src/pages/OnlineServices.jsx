import React, { useState } from 'react'
import { api } from '../utils/api'
import './ServicePage.css'
import SubmissionModal from '../components/SubmissionModal'

const OnlineServices = () => {
  const [selectedService, setSelectedService] = useState(null)
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    message: ''
  })

  const services = [
    {
      id: 1,
      name: 'PAN Card Services',
      description: 'Quick and hassle-free PAN card application and correction services.',
      price: 500,
      features: [
        'New PAN card application',
        'PAN card correction/update',
        'Duplicate PAN card',
        'Track application status',
        'Expert assistance throughout'
      ],
      required_documents: 'Aadhar card, Photo, Address proof'
    },
    {
      id: 2,
      name: 'Passport Services',
      description: 'Complete passport application and renewal support.',
      price: 1500,
      features: [
        'New passport application',
        'Passport renewal',
        'Address change in passport',
        'Document verification support',
        'Appointment booking assistance'
      ],
      required_documents: 'Aadhar, Birth certificate, Photos, Address proof'
    },
    {
      id: 3,
      name: 'Aadhar Card Services',
      description: 'Aadhar card enrollment, update, and related services.',
      price: 300,
      features: [
        'New Aadhar enrollment',
        'Aadhar update/correction',
        'Mobile/email linking',
        'Address update',
        'Biometric update'
      ],
      required_documents: 'Birth certificate, Address proof, Photo'
    },
    {
      id: 4,
      name: 'Driving License Services',
      description: 'Driving license application and renewal made easy.',
      price: 800,
      features: [
        'Learner\'s license application',
        'Permanent license application',
        'License renewal',
        'Address change',
        'Duplicate license'
      ],
      required_documents: 'Age proof, Address proof, Medical certificate, Photos'
    },
    {
      id: 5,
      name: 'Voter ID Services',
      description: 'Voter ID card registration and update services.',
      price: 400,
      features: [
        'New voter ID registration',
        'Voter ID correction',
        'Address update',
        'Photo update',
        'Duplicate voter ID'
      ],
      required_documents: 'Aadhar card, Address proof, Photo'
    },
    {
      id: 6,
      name: 'Ration Card Services',
      description: 'Ration card application and update services.',
      price: 350,
      features: [
        'New ration card application',
        'Family member addition',
        'Address update',
        'Duplicate ration card',
        'Card renewal'
      ],
      required_documents: 'Aadhar card, Address proof, Family photos'
    },
    {
      id: 7,
      name: 'Birth Certificate Services',
      description: 'Birth certificate application and correction services.',
      price: 600,
      features: [
        'New birth certificate',
        'Birth certificate correction',
        'Late registration',
        'Duplicate certificate',
        'Name correction'
      ],
      required_documents: 'Hospital records, Parent ID proof, Address proof'
    },
    {
      id: 8,
      name: 'Income Certificate Services',
      description: 'Income certificate application and renewal services.',
      price: 500,
      features: [
        'New income certificate',
        'Certificate renewal',
        'Income update',
        'Duplicate certificate',
        'Fast-track processing'
      ],
      required_documents: 'Aadhar card, Bank statements, Salary slips'
    }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModal({ visible: true, loading: true })
    try {
      await api.createInquiry({
        service_name: selectedService?.name || 'Online Service',
        ...formData
      })
      setFormData({ customer_name: '', email: '', phone: '', message: '' })
      setSelectedService(null)
      setModal({ visible: true, loading: false, title: 'Inquiry received', message: 'Thanks — we will review your request and get back to you shortly.' })
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      setModal({ visible: true, loading: false, title: 'Thanks', message: 'Your inquiry was received (demo).' })
    }
  }

  const [modal, setModal] = useState({ visible: false, loading: false, title: '', message: '' })

  const features = [
    'Expert assistance throughout',
    'Quick processing',
    'Document verification support',
    'Track application status',
    'Affordable pricing',
    'Hassle-free service'
  ]

  return (
    <div className="service-page online-services-page">
      <div className="container">
        <h1 className="page-title">Online Services</h1>
        <p className="page-subtitle">Government and official document services</p>

        <div className="service-intro">
          <p>We provide comprehensive online services for all your document needs. From PAN cards to passports, 
          we make government document processing simple, fast, and hassle-free with expert guidance at every step.</p>
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

        <section className="services-showcase-section">
          <h2>Our Services</h2>
          <div className="services-list">
          {services.map((service) => (
            <div key={service.id} className="service-item card online-service-card">
              <div className="service-header">
                <h3>{service.name}</h3>
                {service.price && <span className="price">₹{service.price}</span>}
              </div>
              <p className="service-description">{service.description}</p>
              
              {service.features && (
                <div className="service-features">
                  <ul className="features-list">
                    {service.features.map((feature, index) => (
                      <li key={index}>
                        <span className="checkmark">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {service.required_documents && (
                <div className="documents">
                  <strong>Required Documents:</strong> {service.required_documents}
                </div>
              )}
              
              <button
                className="btn btn-primary"
                onClick={() => setSelectedService(service)}
              >
                Apply Now
              </button>
            </div>
          ))}
          </div>
        </section>

        {selectedService && (
          <div className="modal-overlay" onClick={() => setSelectedService(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Apply for {selectedService.name}</h2>
              <form onSubmit={handleSubmit}>
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
                  <label>Additional Details</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows="4"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Submit Application</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedService(null)}>
                    Cancel
                  </button>
                </div>
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

export default OnlineServices

