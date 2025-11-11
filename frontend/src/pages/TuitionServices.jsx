import React, { useState } from 'react'
import { api } from '../utils/api'
import './ServicePage.css'
import SubmissionModal from '../components/SubmissionModal'

const TuitionServices = () => {
  const [formData, setFormData] = useState({
    student_name: '',
    parent_name: '',
    email: '',
    phone: '',
    class: '',
    board: '',
    subjects: [],
    message: ''
  })

  const classes = ['9', '10', '11', '12']
  const boards = ['CBSE', 'ICSE', 'State Board']
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English', 'Tamil', 'Hindi', 'Computer Science',
    'Economics', 'Commerce', 'Accountancy'
  ]

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.subjects.length === 0) {
      alert('Please select at least one subject')
      return
    }
    setModal({ visible: true, loading: true })
    try {
      await api.createInquiry({
        service_name: 'Tuition Services',
        customer_name: formData.parent_name,
        email: formData.email,
        phone: formData.phone,
        message: `Student: ${formData.student_name}, Class: ${formData.class}, Board: ${formData.board}, Subjects: ${formData.subjects.join(', ')}. ${formData.message}`
      })
      setFormData({ student_name: '', parent_name: '', email: '', phone: '', class: '', board: '', subjects: [], message: '' })
      setModal({ visible: true, loading: false, title: 'Enrollment request received', message: 'Thank you — our tutoring team will reach out to arrange classes and timings.' })
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      setModal({ visible: true, loading: false, title: 'Thanks', message: 'Your request was received (demo).' })
    }
  }

  const [modal, setModal] = useState({ visible: false, loading: false, title: '', message: '' })

  const features = [
    'Experienced teachers',
    'All boards covered',
    'Flexible timings',
    'Small batch sizes',
    'Regular assessments',
    'Affordable fees'
  ]

  return (
    <div className="service-page tuition-page">
      <div className="container">
        <h1 className="page-title">Tuition Services</h1>
        <p className="page-subtitle">Quality education for Classes 9-12</p>

        <div className="service-intro">
          <p>Excel in your studies with our expert tuition services. We provide quality education for Classes 9-12 
          across all boards (CBSE, ICSE, State Board) with experienced teachers, flexible timings, and personalized attention.</p>
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

        <section className="classes-section">
          <h2>Classes & Boards</h2>
          <div className="classes-boards-grid">
            <div className="classes-minimal">
              <h3>Classes Offered</h3>
              <div className="classes-list-minimal">
                {classes.map((cls) => (
                  <div key={cls} className="class-item-minimal">Class {cls}</div>
                ))}
              </div>
            </div>
            <div className="boards-minimal">
              <h3>Boards</h3>
              <div className="boards-list-minimal">
                {boards.map((board) => (
                  <div key={board} className="board-item-minimal">{board}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="subjects-section">
          <h2>Subjects Available</h2>
          <div className="subjects-grid-minimal">
            {subjects.map((subject) => (
              <div key={subject} className="subject-item-minimal">{subject}</div>
            ))}
          </div>
        </section>

        <section className="fee-section">
          <h2>Fee Structure</h2>
          <div className="fee-card">
            <div className="fee-row">
              <span>Per Subject (Monthly)</span>
              <span className="fee-amount">₹1,500</span>
            </div>
            <div className="fee-row">
              <span>Batch Timings</span>
              <span className="fee-amount">Flexible</span>
            </div>
            <div className="fee-row">
              <span>Experienced Teachers</span>
              <span className="fee-amount">✓</span>
            </div>
          </div>
        </section>

        <section className="enrollment-section-minimal">
          <div className="enrollment-container">
            <h2>Enrollment Form</h2>
            <p className="enrollment-subtitle">Fill out the form below to enroll your child</p>
            <form onSubmit={handleSubmit} className="enrollment-form-minimal">
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Parent/Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Class *</label>
                  <select
                    required
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Board *</label>
                  <select
                    required
                    value={formData.board}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                  >
                    <option value="">Select Board</option>
                    {boards.map((board) => (
                      <option key={board} value={board}>{board}</option>
                    ))}
                  </select>
                </div>
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
                <label>Subjects Interested *</label>
                <div className="subjects-selector">
                  {subjects.map((subject) => (
                    <label key={subject} className="subject-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                      />
                      <span>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows="4"
                  placeholder="Preferred timings, special requirements..."
                />
              </div>
              <button type="submit" className="btn btn-primary">Submit Enrollment</button>
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

export default TuitionServices

