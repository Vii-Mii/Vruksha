import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Home.css'

const Home = () => {
  const location = useLocation()

  useEffect(() => {
    // If navigation requested to scroll to services, do it after render
    if (location?.state?.scrollTo === 'services') {
      const el = document.getElementById('services')
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      }
    }
  }, [location])

  const services = [
    { 
      name: 'Online Services', 
      path: '/online-services', 
      iconType: 'online', 
      description: 'Digital solutions for your everyday needs, from tech support to online consultations.' 
    },
    { 
      name: 'Catering Services', 
      path: '/catering-services', 
      iconType: 'catering', 
      description: 'Delicious catering for all occasions—weddings, parties, corporate events, and more.' 
    },
    { 
      name: 'Beautician Services', 
      path: '/beautician-services', 
      iconType: 'beauty', 
      description: 'Professional beauty services at your doorstep—makeup, hair styling, and skincare.' 
    },
    { 
      name: 'Pooja Services', 
      path: '/pooja-services', 
      iconType: 'pooja', 
      description: 'Complete pooja items and professional pooja services for all Hindu rituals.' 
    },
    { 
      name: 'Flower Decoration', 
      path: '/flower-decoration', 
      iconType: 'flowers', 
      description: 'Beautiful flower decorations and materials for weddings and special events.' 
    },
    { 
      name: 'Tuition Classes', 
      path: '/tuition-services', 
      iconType: 'education', 
      description: 'Expert tutoring for Classes 9-12 (CBSE, ICSE, State Board) to help students excel.' 
    },
    { 
      name: 'Clothing Reseller', 
      path: '/clothing-store', 
      iconType: 'clothing', 
      description: 'Quality clothing at affordable prices—your trusted fashion destination.' 
    },
    { 
      name: 'Toys Reseller', 
      path: '/toys-store', 
      iconType: 'toys', 
      description: 'Fun and educational toys for children of all ages at great prices.' 
    },
  ]

  const whyChooseFeatures = [
    { 
      title: 'Trusted Services', 
      description: 'Verified service providers with proven track records',
      iconType: 'shield'
    },
    { 
      title: 'Easy Booking', 
      description: 'Simple online booking and inquiry system',
      iconType: 'calendar'
    },
    { 
      title: 'Affordable Prices', 
      description: 'Competitive pricing for all services',
      iconType: 'price'
    },
    { 
      title: '24/7 Support', 
      description: 'Round-the-clock customer support',
      iconType: 'support'
    }
  ]

  const renderIcon = (iconType, size = "40") => {
    switch(iconType) {
      case 'shield':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 5V11C4 16.55 7.16 21.74 12 23C16.84 21.74 20 16.55 20 11V5L12 2Z" fill="white" stroke="none"/>
            <path d="M9 12L11 14L15 10" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'calendar':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" fill="white" stroke="none"/>
            <path d="M16 2V6M8 2V6M3 10H21" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="15" r="1.5" fill="#D4AF37"/>
            <circle cx="16" cy="15" r="1.5" fill="#D4AF37"/>
            <circle cx="8" cy="15" r="1.5" fill="#D4AF37"/>
          </svg>
        )
      case 'price':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" fill="white"/>
            <rect x="10" y="7" width="4" height="10" rx="0.5" fill="#D4AF37"/>
            <rect x="7" y="9" width="10" height="2" rx="1" fill="#D4AF37"/>
            <rect x="7" y="13" width="10" height="2" rx="1" fill="#D4AF37"/>
            <text x="12" y="12.5" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">₹</text>
          </svg>
        )
      case 'support':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" fill="white"/>
            <circle cx="12" cy="12" r="2" fill="#D4AF37"/>
            <path d="M12 3V7M12 17V21M21 12H17M7 12H3" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M18.364 5.636L15.536 8.464M8.464 15.536L5.636 18.364M18.364 18.364L15.536 15.536M8.464 8.464L5.636 5.636" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      case 'online':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="14" rx="2" fill="white"/>
            <path d="M8 9L12 12L16 9" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2" y="3" width="20" height="16" rx="2" stroke="#D4AF37" strokeWidth="1.5" fill="none"/>
            <path d="M22 7L13 13C12.4 13.3 11.6 13.3 11 13L2 7" stroke="#D4AF37" strokeWidth="1.5"/>
          </svg>
        )
      case 'catering':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" fill="white"/>
            <path d="M12 6V12L16 16" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 8L10 10M14 8L16 10" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="1.5" fill="none"/>
          </svg>
        )
      case 'beauty':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="5" fill="white"/>
            <path d="M7 8C7 5.24 9.24 3 12 3S17 5.24 17 8" stroke="#D4AF37" strokeWidth="2"/>
            <path d="M12 13C8.69 13 6 15.69 6 19V21H18V19C18 15.69 15.31 13 12 13Z" fill="white"/>
            <path d="M12 13C8.69 13 6 15.69 6 19V21H18V19C18 15.69 15.31 13 12 13Z" stroke="#D4AF37" strokeWidth="1.5"/>
            <circle cx="9" cy="7" r="1" fill="#D4AF37"/>
            <circle cx="15" cy="7" r="1" fill="#D4AF37"/>
          </svg>
        )
      case 'pooja':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14 8L20 6L16 12L22 14L12 12L2 14L8 12L4 6L10 8L12 2Z" fill="white"/>
            <path d="M12 2L14 8L20 6L16 12L22 14L12 12L2 14L8 12L4 6L10 8L12 2Z" stroke="#D4AF37" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="3" fill="#D4AF37"/>
            <path d="M12 9V15M9 12H15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      case 'flowers':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="3" fill="white"/>
            <circle cx="8" cy="12" r="2.5" fill="white"/>
            <circle cx="16" cy="12" r="2.5" fill="white"/>
            <circle cx="10" cy="16" r="2" fill="white"/>
            <circle cx="14" cy="16" r="2" fill="white"/>
            <path d="M12 5C10 5 8 6 8 8S10 11 12 11S16 9 16 8S14 5 12 5Z" stroke="#D4AF37" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2" fill="#D4AF37"/>
            <path d="M12 18V22" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'education':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L2 7L12 11L22 7L12 3Z" fill="white"/>
            <path d="M12 3L2 7L12 11L22 7L12 3Z" stroke="#D4AF37" strokeWidth="1.5"/>
            <path d="M2 7V17L12 21L22 17V7" stroke="#D4AF37" strokeWidth="1.5" fill="none"/>
            <circle cx="12" cy="7" r="1.5" fill="#D4AF37"/>
            <path d="M7 9V15L12 17L17 15V9" fill="white"/>
            <path d="M7 9V15L12 17L17 15V9" stroke="#D4AF37" strokeWidth="1"/>
          </svg>
        )
      case 'clothing':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2H16L19 5V22H5V5L8 2Z" fill="white"/>
            <path d="M8 2H16L19 5V22H5V5L8 2Z" stroke="#D4AF37" strokeWidth="1.5"/>
            <path d="M8 6H16M8 10H16M8 14H13" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="8" r="1" fill="#D4AF37"/>
            <path d="M10 18H14" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )
      case 'toys':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="white"/>
            <circle cx="12" cy="12" r="8" stroke="#D4AF37" strokeWidth="1.5"/>
            <circle cx="9" cy="10" r="1.5" fill="#D4AF37"/>
            <circle cx="15" cy="10" r="1.5" fill="#D4AF37"/>
            <path d="M8 15C8 15 10 17 12 17S16 15 16 15" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 4V2M4 12H2M12 20V22M20 12H22" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="vruksha-logo">
              <div className="vruksha-logo-wrapper">
                <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Enhanced tree trunk with gradient */}
                  <defs>
                    <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8B4513"/>
                      <stop offset="100%" stopColor="#654321"/>
                    </linearGradient>
                    <linearGradient id="leavesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="white"/>
                      <stop offset="50%" stopColor="#f8f9fa"/>
                      <stop offset="100%" stopColor="white"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Tree trunk */}
                  <rect x="55" y="70" width="10" height="30" fill="url(#trunkGradient)" rx="3"/>
                  <rect x="53" y="75" width="14" height="4" fill="url(#trunkGradient)" rx="2" opacity="0.6"/>
                  
                  {/* Tree branches/leaves - creating enhanced tree shape */}
                  <circle cx="60" cy="50" r="25" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="1"/>
                  <circle cx="45" cy="45" r="18" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.8" opacity="0.9"/>
                  <circle cx="75" cy="45" r="18" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.8" opacity="0.9"/>
                  <circle cx="50" cy="35" r="15" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.6" opacity="0.8"/>
                  <circle cx="70" cy="35" r="15" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.6" opacity="0.8"/>
                  <circle cx="60" cy="25" r="12" fill="url(#leavesGradient)" stroke="#D4AF37" strokeWidth="0.6" opacity="0.7"/>
                  
                  {/* Tree details - small branches */}
                  <path d="M60 70 L45 60 M60 70 L75 60 M60 65 L50 55 M60 65 L70 55" stroke="#D4AF37" strokeWidth="1.5" opacity="0.4"/>
                  
                  {/* Small decorative leaves */}
                  <circle cx="40" cy="40" r="3" fill="#D4AF37" opacity="0.6"/>
                  <circle cx="80" cy="40" r="3" fill="#D4AF37" opacity="0.6"/>
                  <circle cx="45" cy="25" r="2.5" fill="#D4AF37" opacity="0.5"/>
                  <circle cx="75" cy="25" r="2.5" fill="#D4AF37" opacity="0.5"/>
                  <circle cx="60" cy="15" r="2" fill="#D4AF37" opacity="0.7"/>
                </svg>
              </div>
            </div>
            <h1 className="hero-title">Welcome to Vruksha</h1>
            <p className="hero-subtitle">Connecting Chennai to Everything You Need</p>
            <p className="hero-description">
              Your trusted partner for all services in Chennai. From government documents to shopping, 
              beauty to education—we bring quality services right to your doorstep with ease and reliability.
            </p>
            <div className="hero-actions">
              <Link to="/contact" className="btn btn-primary">Get Started</Link>
              <Link to="/about" className="btn btn-secondary">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="why-choose-section">
        <div className="container">
          <h2 className="section-title">Why Choose Vruksha?</h2>
          <p className="section-subtitle">Experience the difference with our trusted services</p>
          <div className="why-choose-grid">
            {whyChooseFeatures.map((feature, index) => (
              <div key={index} className="why-choose-card">
                <div className="why-choose-icon-wrapper">
                  {renderIcon(feature.iconType)}
                </div>
                <h3 className="why-choose-title">{feature.title}</h3>
                <p className="why-choose-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

  <section id="services" className="services-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Explore our wide range of services designed for Chennai residents</p>
          <div className="services-grid">
            {services.map((service, index) => (
              <Link key={index} to={service.path} className="service-card">
                <div className="service-icon-wrapper">
                  {renderIcon(service.iconType, "48")}
                </div>
                <h3 className="service-name">{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <span className="service-link">Explore →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              <li><Link to="/online-services">Online Services</Link></li>
              <li><Link to="/clothing-store">Clothing Store</Link></li>
              <li><Link to="/toys-store">Toys Store</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-col footer-contact">
            <h4>Contact</h4>
            <p className="contact-line">contact@vruksha.com</p>
            <p className="contact-line">+91 12345 67890</p>
            <p className="contact-line">Chennai, India</p>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© 2025 Vruksha Services. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home

