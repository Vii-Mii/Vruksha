import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart, getCartTotal, clearCart } from '../utils/cart'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from 'react-router-dom'
import './Checkout.css'

const Checkout = () => {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [total, setTotal] = useState(0)
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Chennai',
    pincode: '',
    payment_method: 'cash'
  })

  useEffect(() => {
    const cartItems = getCart()
    if (cartItems.length === 0) {
      navigate('/cart')
      return
    }
    setCart(cartItems)
    setTotal(getCartTotal())
  }, [navigate])

  const { isAuthenticated, loading: authLoading } = useAuth()
  const location = useLocation()
  useEffect(() => {
    // Wait for auth initialization to complete before deciding to redirect.
    if (!authLoading && !isAuthenticated()) {
      // Redirect to login and keep the next path so user returns here after auth
      navigate('/login', { state: { next: location.pathname } })
    }
  }, [authLoading, isAuthenticated, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const orderData = {
        ...formData,
        total_amount: total + (total > 1000 ? 0 : 100),
        items: JSON.stringify(cart)
      }
      const token = localStorage.getItem('token')
      if (!token) {
        // Shouldn't happen because Checkout redirects unauthenticated users, but guard anyway
        navigate('/login', { state: { next: location.pathname } })
        return
      }

      // If payment_method is upi, create a Razorpay QR and show it to the user
      if (formData.payment_method === 'upi') {
        const createResp = await api.createRazorpayQR(orderData.total_amount, { items: cart, customer_name: formData.customer_name, email: formData.email, phone: formData.phone, address: formData.address }, token)
        // show QR image and poll for verification
        if (createResp && createResp.image_url) {
          // open a simple modal-like flow: replace page content with QR image
          const paymentId = createResp.payment_id
          // store pending payment for Orders page fallback
          sessionStorage.setItem('pending_payment_id', paymentId)

          // Replace the whole page with QR UI (simple approach)
          document.body.innerHTML = `\n            <div style="padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;text-align:center">\n              <h2>Scan to pay (UPI)</h2>\n              <img src="${createResp.image_url}" alt="QR Code" style="max-width:100%;height:auto;"/>\n              <p>Please scan the QR with your UPI app and complete the payment. This page will auto-detect when the payment is received.</p>\n              <p id="status">Waiting for payment...</p>\n            </div>`

          const poll = setInterval(async () => {
            try {
              const v = await api.verifyPayment(paymentId, token)
              if (v && v.status === 'paid') {
                clearInterval(poll)
                sessionStorage.removeItem('pending_payment_id')
                clearCart()
                alert('Payment received — order placed!')
                window.location.href = '/orders'
              }
            } catch (err) {
              console.error('verify poll error', err)
            }
          }, 3000)

          return
        } else {
          throw new Error('Could not create QR: ' + JSON.stringify(createResp))
        }
      }

      // fallback: place order without provider (cash/card handled separately)
      const res = await api.createOrderWithAuth(orderData, token)

      // Clear cart and navigate to orders page so user can see the stored order
      clearCart()
      alert('Order placed successfully! Thank you for your purchase.')
      navigate('/orders')
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Could not place order. Please try again.')
    }
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Checkout</h1>

        <div className="checkout-content">
          <div className="checkout-form-section">
            <h2>Delivery Details</h2>
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Your full name"
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
              </div>
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="3"
                  placeholder="Street address, apartment, suite, etc."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="600001"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  required
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="cash">Cash on Delivery</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary place-order-btn">
                Place Order
              </button>
            </form>
          </div>

          <div className="order-summary-section">
            <h2>Order Summary</h2>
            <div className="order-items">
              {cart.map((item, index) => (
                <div key={`${item.id}-${item.size || 'default'}-${index}`} className="order-item">
                  <div className="order-item-info">
                    <h4>{item.name}</h4>
                    {item.size && <p className="order-item-size">Size: {item.size}</p>}
                    <p className="order-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <p className="order-item-price">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping:</span>
                <span>₹{total > 1000 ? '0.00' : '100.00'}</span>
              </div>
              <div className="total-row final-total">
                <span>Total:</span>
                <span>₹{(total + (total > 1000 ? 0 : 100)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout

