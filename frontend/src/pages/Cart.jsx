import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, updateCartItemQuantity, removeFromCart, getCartTotal, setCartLocal } from '../utils/cart'
import { useAuth } from '../contexts/AuthContext'
import { cartApi } from '../utils/api'
import './Cart.css'

const Cart = () => {
  const [cart, setCart] = useState([])
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()
  const auth = useAuth()

  useEffect(() => {
    updateCart()
    const handler = () => updateCart()
    window.addEventListener('cartUpdated', handler)

    let mounted = true
    ;(async () => {
      if (auth && auth.token) {
        try {
          const resp = await cartApi.getCart(auth.token)
          if (mounted && resp && resp.items) {
            setCartLocal(resp.items)
            updateCart()
          }
        } catch (err) {
          console.error('Failed to load server cart:', err)
        }
      }
    })()

    return () => {
      window.removeEventListener('cartUpdated', handler)
      mounted = false
    }
  }, [auth && auth.token])

  const updateCart = () => {
    const cartItems = getCart()
    setCart(cartItems)
    setTotal(getCartTotal())
  }

  const handleQuantityChange = (productId, newQuantity, size = null) => {
    updateCartItemQuantity(productId, newQuantity, size)
    updateCart()
  }

  const handleRemove = (productId, size = null) => {
    removeFromCart(productId, size)
    updateCart()
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1 className="page-title">Shopping Cart</h1>
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some items to your cart to continue shopping.</p>
            <Link to="/clothing-store" className="btn btn-primary">Start Shopping</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Shopping Cart</h1>
        
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={`${item.id}-${item.size || 'default'}-${index}`} className="cart-item card">
                <div className="cart-item-image">
                  <img src={item.selectedImage || item.image_url || 'https://via.placeholder.com/150'} alt={item.name} />
                </div>
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  {item.selectedColor && (
                    <p className="item-color">Color: <span className="color-swatch" style={{ display: 'inline-block', width: 12, height: 12, background: item.selectedColor.hex || item.color || '#ccc', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }} />{item.selectedColor.name}</p>
                  )}
                  {item.size && <p className="item-size">Size: {item.size}</p>}
                  <p className="item-price">₹{item.price}</p>
                </div>
                <div className="cart-item-quantity">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.size)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.size)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-item-total">
                  <p className="item-total">₹{item.price * item.quantity}</p>
                  <button
                    onClick={() => handleRemove(item.id, item.size)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping:</span>
                <span>₹{total > 1000 ? '0.00' : '100.00'}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>₹{(total + (total > 1000 ? 0 : 100)).toFixed(2)}</span>
              </div>
              {total > 1000 && (
                <p className="free-shipping">🎉 Free shipping on orders above ₹1,000!</p>
              )}
              <button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary checkout-btn"
              >
                Proceed to Checkout
              </button>
              <Link to="/clothing-store" className="continue-shopping">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart

