import React from 'react'
import { Link } from 'react-router-dom'
import './About.css'

const About = () => {
  return (
    <div className="about-page clean-about">
      <div className="container about-container">
        <header className="about-header">
          <div className="logo-mark">
            <svg width="64" height="64" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="55" y="70" width="10" height="30" fill="#8B4513" rx="3"/>
              <circle cx="60" cy="50" r="25" fill="#D4AF37" opacity="0.95"/>
            </svg>
          </div>
          <div className="about-title">
            <h1>Vruksha</h1>
            <p className="tagline">Connecting Chennai to essential services — simple, local, trusted.</p>
          </div>
        </header>

        <section className="about-summary">
          <p>
            We simplify everyday life in Chennai by bringing verified services, trusted providers, and
            local products together in one clean, easy-to-use platform. Our focus is on quality,
            convenience, and uplifting the local community.
          </p>
        </section>

        <section className="about-expanded">
          <div className="grid-two">
            <div className="panel">
              <h2>Our Mission</h2>
              <p>
                To make essential services accessible to everyone in Chennai through a dependable,
                transparent, and user-friendly platform. We strive to connect customers with vetted
                providers and ensure a consistent, high-quality experience.
              </p>

              <h2>Our Story</h2>
              <p>
                Vruksha was born out of a desire to solve everyday problems faced by city residents.
                What began as help with government document services and local errands has grown into
                a platform supporting hundreds of small businesses and serving thousands of customers.
              </p>
            </div>

            <div className="panel">
              <h2>Values</h2>
              <div className="values-grid">
                <div className="value-item">
                  <strong>Integrity</strong>
                  <span>Transparent pricing and honest service listings.</span>
                </div>
                <div className="value-item">
                  <strong>Quality</strong>
                  <span>Vetted partners and consistent standards for every booking.</span>
                </div>
                <div className="value-item">
                  <strong>Community</strong>
                  <span>Local-first approach that supports Chennai businesses.</span>
                </div>
                <div className="value-item">
                  <strong>Care</strong>
                  <span>User-focused support and easy dispute resolution.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="what-we-offer">
            <h2>What We Offer</h2>
            <p>
              A curated range of services spanning government document assistance, home services,
              event catering, beauty and wellness at home, tuition support, and local shopping
              options — all available with clear pricing and simple booking.
            </p>
          </div>

          <div className="commitment">
            <h2>Our Commitment to Chennai</h2>
            <p>
              We are committed to creating opportunities for local providers while delivering reliable
              services to residents. We aim to be a platform that residents can trust for everyday
              needs and special moments alike.
            </p>
          </div>

          <div className="team-testimonial">
            <div className="team">
              <h3>Meet the Team</h3>
              <p className="muted">A small team of local entrepreneurs and technologists, rooted in Chennai.</p>
              <div className="people">
                <div className="person">
                  <div className="avatar">KP</div>
                  <div className="meta">
                    <strong>K. Prasad</strong>
                    <span>Co-founder — Operations</span>
                  </div>
                </div>
                <div className="person">
                  <div className="avatar">AS</div>
                  <div className="meta">
                    <strong>A. Sree</strong>
                    <span>Co-founder — Product</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial">
              <h3>Customer Note</h3>
              <blockquote>
                "Vruksha made arranging puja items and a pandit's services for my family simple and
                worry-free. Professional and prompt — highly recommended."
              </blockquote>
              <cite>— R. Srinivasan, Chennai</cite>
            </div>
          </div>
        </section>

        <section className="about-cta">
          <Link to="/contact" className="btn btn-primary">Get in touch</Link>
          <Link to="/" className="btn btn-ghost">Explore services</Link>
        </section>
      </div>
    </div>
  )
}

export default About

