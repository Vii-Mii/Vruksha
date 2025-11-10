import React, { useState, useEffect } from 'react'
import { api, adminApi } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

const Admin = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
    const [adminCheckCompleted, setAdminCheckCompleted] = useState(false)
  const [activeTab, setActiveTab] = useState('clothing')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [productsList, setProductsList] = useState([])
  const [editingProduct, setEditingProduct] = useState(null)
  const [ordersList, setOrdersList] = useState([])
  const [usersList, setUsersList] = useState([])
  const [shipmentStates, setShipmentStates] = useState({})
  const [expandedOrder, setExpandedOrder] = useState(null)

  const [clothingForm, setClothingForm] = useState({
    name: '',
    subcategory: 'sarees',
    description: '',
    price: '',
    image: null,
    imagePreview: '',
    size: 'Free Size',
    stock: 10
  })

  const [poojaForm, setPoojaForm] = useState({
    name: '',
    subcategory: 'idols',
    description: '',
    price: '',
    image: null,
    imagePreview: '',
    stock: 10
  })

  const [toysForm, setToysForm] = useState({
    name: '',
    subcategory: 'educational',
    description: '',
    price: '',
    image: null,
    imagePreview: '',
    age_group: '5-10',
    stock: 10
  })

  const clothingSubcategories = [
    { value: 'sarees', label: 'Sarees' },
    { value: 'kurtis', label: 'Kurtis & Kurta Sets' },
    { value: 'ethnic_wear', label: 'Ethnic Wear' },
    { value: 'western', label: 'Western Wear' }
  ]

  const poojaSubcategories = [
    { value: 'idols', label: 'Idols' },
    { value: 'incense', label: 'Incense' },
    { value: 'kits', label: 'Puja Kits' },
    { value: 'decorations', label: 'Decorations' },
    { value: 'other', label: 'Other' }
  ]

  const toysSubcategories = [
    { value: 'educational', label: 'Educational Toys' },
    { value: 'rc_cars', label: 'RC Cars & Remote Control' },
    { value: 'board_games', label: 'Board Games & Puzzles' },
    { value: 'action_figures', label: 'Action Figures' },
    { value: 'soft_toys', label: 'Soft Toys' },
    { value: 'outdoor', label: 'Outdoor Toys' }
  ]

  const clothingSizes = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size']
  const toysAgeGroups = ['0-3', '3-5', '5-10', '10+', 'All Ages']

  const showMessage = (message, isError = false) => {
    if (isError) {
      setErrorMessage(message)
      setSuccessMessage('')
      setTimeout(() => setErrorMessage(''), 5000)
    } else {
      setSuccessMessage(message)
      setErrorMessage('')
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }

  useEffect(() => {
    if (['clothing', 'pooja', 'toys'].includes(activeTab)) {
      fetchProductsForTab(activeTab)
    } else if (activeTab === 'orders') {
      fetchOrdersList()
    } else if (activeTab === 'users') {
      fetchUsersList()
    }
  }, [activeTab])

  // On mount, ensure the current user is admin before allowing access to admin UI.
  useEffect(() => {
    let cancelled = false

    const hasAdminFlag = (u) => {
      if (!u) return false
      const v = u.is_admin
      return v === true || v === 1 || v === '1' || v === 'true'
    }

    const verify = async () => {
      // wait for auth provider to finish initial load
      if (loading) return

      // build effective user from context or localStorage
      let effectiveUser = user
      if (!effectiveUser) {
        try {
          const s = localStorage.getItem('user')
          if (s) effectiveUser = JSON.parse(s)
        } catch (err) {
          effectiveUser = null
        }
      }

      if (hasAdminFlag(effectiveUser)) {
        if (!cancelled) setAdminCheckCompleted(true)
        return
      }

      const token = localStorage.getItem('token')
      if (token) {
        try {
          const resp = await fetch('http://localhost:8000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          if (resp.ok) {
            const data = await resp.json()
            localStorage.setItem('user', JSON.stringify(data))
            if (hasAdminFlag(data)) {
              if (!cancelled) setAdminCheckCompleted(true)
              return
            }
          }
        } catch (err) {
          console.error('Admin page: failed to verify /api/auth/me', err)
        }
      }

      // Not an admin — redirect to home
      if (!cancelled) {
        navigate('/')
      }
    }

    verify()
    return () => { cancelled = true }
  }, [loading, user])

  const fetchProductsForTab = async (tab) => {
    try {
      let category = null
      if (tab === 'clothing') category = 'clothing'
      if (tab === 'pooja') category = 'pooja_items'
      if (tab === 'toys') category = 'toys'
      const data = await api.getProducts(category)
      setProductsList(data)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const startEditProduct = (product) => {
    setEditingProduct(product)
    if (product.category === 'clothing') {
      setClothingForm({
        name: product.name || '',
        subcategory: product.subcategory || 'sarees',
        description: product.description || '',
        price: product.price || '',
        image: null,
        imagePreview: product.image_url || '',
        size: product.size || 'Free Size',
        stock: product.stock || 10
      })
    } else if (product.category === 'pooja_items') {
      setPoojaForm({
        name: product.name || '',
        subcategory: product.subcategory || 'idols',
        description: product.description || '',
        price: product.price || '',
        image: null,
        imagePreview: product.image_url || '',
        stock: product.stock || 10
      })
    } else if (product.category === 'toys') {
      setToysForm({
        name: product.name || '',
        subcategory: product.subcategory || 'educational',
        description: product.description || '',
        price: product.price || '',
        image: null,
        imagePreview: product.image_url || '',
        age_group: product.age_group || '5-10',
        stock: product.stock || 10
      })
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await api.deleteProduct(productId)
      showMessage('Product deleted successfully')
      fetchProductsForTab(activeTab)
    } catch (err) {
      console.error('Failed to delete product:', err)
      showMessage('Failed to delete product', true)
    }
  }

  const fetchOrdersList = async () => {
    try {
      const data = await adminApi.listOrders()
      setOrdersList(data)
      // initialize per-order shipment inputs from server data if available
      const initial = {}
      data.forEach(o => {
        if (o.shipment) {
          initial[o.id] = {
            courier_name: o.shipment.courier_name || '',
            tracking_number: o.shipment.tracking_number || ''
          }
        } else {
          initial[o.id] = { courier_name: '', tracking_number: '' }
        }
      })
      setShipmentStates(initial)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      showMessage('Failed to fetch orders', true)
    }
  }

  const toggleOrder = (id) => setExpandedOrder(prev => (prev === id ? null : id))

  const renderOrderItems = (itemsJson) => {
    let items = []
    try {
      items = JSON.parse(itemsJson || '[]')
    } catch (e) {
      items = []
    }
    if (items.length === 0) return <div className="muted">No item details</div>
    return (
      <div className="order-items-list">
        {items.map((it, idx) => (
          <div key={idx} className="order-item-row">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={it.image_url || 'https://via.placeholder.com/80'} alt={it.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
              <div>
                <strong>{it.name}</strong>
                <div style={{ color: '#666', fontSize: 13 }}>{(it.subcategory || '')} • ₹{it.price}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 120 }}>
              <div style={{ color: '#444', fontSize: 13 }}>Qty: {it.quantity}</div>
              <div style={{ fontWeight: 600, marginTop: 6 }}>₹{(it.price * (it.quantity || 1)).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const orderStatusBadge = (o) => {
    if (o.shipment && o.shipment.tracking_number) return <span className="shipped-badge">Shipped</span>
    if (o.shipment) return <span className="badge badge-yellow">In transit</span>
    return <span className="badge badge-gray">Pending</span>
  }

  const fetchUsersList = async () => {
    try {
      const data = await adminApi.listUsers()
      setUsersList(data)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      showMessage('Failed to fetch users', true)
    }
  }

  const promoteUser = async (userId) => {
    try {
      await adminApi.promoteUser(userId)
      showMessage('User promoted to admin')
      fetchUsersList()
    } catch (err) {
      console.error('Failed to promote user:', err)
      showMessage('Failed to promote user', true)
    }
  }

  const demoteUser = async (userId) => {
    try {
      await adminApi.demoteUser(userId)
      showMessage('User demoted from admin')
      fetchUsersList()
    } catch (err) {
      console.error('Failed to demote user:', err)
      showMessage('Failed to demote user', true)
    }
  }

  const markOrderShipped = async (orderId) => {
    try {
      const s = shipmentStates[orderId] || { courier_name: '', tracking_number: '' }
      const payload = { order_id: orderId, courier_name: s.courier_name, tracking_number: s.tracking_number }
      await adminApi.createShipment(payload)
      showMessage('Order marked as shipped')
      setShipmentStates(prev => ({ ...prev, [orderId]: { courier_name: '', tracking_number: '' } }))
      fetchOrdersList()
    } catch (err) {
      console.error('Failed to create shipment:', err)
      showMessage('Failed to mark as shipped', true)
    }
  }

  const handleImageUpload = (file, formType) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file.', true)
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('Image size should be less than 5MB.', true)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imagePreview = e.target.result
        
        if (formType === 'clothing') {
          setClothingForm(prev => ({ ...prev, image: file, imagePreview }))
        } else if (formType === 'pooja') {
          setPoojaForm(prev => ({ ...prev, image: file, imagePreview }))
        } else if (formType === 'toys') {
          setToysForm(prev => ({ ...prev, image: file, imagePreview }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'vruksha_products') // You'll need to create this preset in Cloudinary
    
    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload image')
      }
      
      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Image upload error:', error)
      // For now, return a placeholder URL since Cloudinary setup is needed
      return URL.createObjectURL(file)
    }
  }

  const handleClothingSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!clothingForm.name || !clothingForm.description || !clothingForm.price || !clothingForm.image) {
        showMessage('Please fill in all required fields including image.', true)
        return
      }

      // Upload image and get URL
      const imageUrl = await uploadImageToCloudinary(clothingForm.image)
      
      const productData = {
        name: clothingForm.name.trim(),
        category: 'clothing',
        subcategory: clothingForm.subcategory,
        description: clothingForm.description.trim(),
        price: parseFloat(clothingForm.price),
        image_url: imageUrl,
        size: clothingForm.size || null,
        stock: parseInt(clothingForm.stock) || 10
      }
      
      if (editingProduct && editingProduct.id) {
        await api.updateProduct(editingProduct.id, productData)
        showMessage('Clothing item updated successfully!')
        setEditingProduct(null)
      } else {
        await api.createProduct(productData)
        showMessage('Clothing item added successfully!')
      }
      fetchProductsForTab('clothing')
      setClothingForm({
        name: '',
        subcategory: 'sarees',
        description: '',
        price: '',
        image: null,
        imagePreview: '',
        size: 'Free Size',
        stock: 10
      })
    } catch (error) {
      console.error('Error adding product:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Error adding product. Please try again.'
      showMessage(errorMsg, true)
    }
  }

  const handlePoojaSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!poojaForm.name || !poojaForm.description || !poojaForm.price || !poojaForm.image) {
        showMessage('Please fill in all required fields including image.', true)
        return
      }

      // Upload image and get URL
      const imageUrl = await uploadImageToCloudinary(poojaForm.image)
      
      const productData = {
        name: poojaForm.name.trim(),
        category: 'pooja_items',
        subcategory: poojaForm.subcategory,
        description: poojaForm.description.trim(),
        price: parseFloat(poojaForm.price),
        image_url: imageUrl,
        stock: parseInt(poojaForm.stock) || 10
      }
      
      if (editingProduct && editingProduct.id) {
        await api.updateProduct(editingProduct.id, productData)
        showMessage('Pooja item updated successfully!')
        setEditingProduct(null)
      } else {
        await api.createProduct(productData)
        showMessage('Pooja item added successfully!')
      }
      fetchProductsForTab('pooja')
      setPoojaForm({
        name: '',
        subcategory: 'idols',
        description: '',
        price: '',
        image: null,
        imagePreview: '',
        stock: 10
      })
    } catch (error) {
      console.error('Error adding product:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Error adding product. Please try again.'
      showMessage(errorMsg, true)
    }
  }

  const handleToysSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!toysForm.name || !toysForm.description || !toysForm.price || !toysForm.image) {
        showMessage('Please fill in all required fields including image.', true)
        return
      }

      // Upload image and get URL
      const imageUrl = await uploadImageToCloudinary(toysForm.image)
      
      const productData = {
        name: toysForm.name.trim(),
        category: 'toys',
        subcategory: toysForm.subcategory,
        description: toysForm.description.trim(),
        price: parseFloat(toysForm.price),
        image_url: imageUrl,
        age_group: toysForm.age_group || null,
        stock: parseInt(toysForm.stock) || 10
      }
      
      if (editingProduct && editingProduct.id) {
        await api.updateProduct(editingProduct.id, productData)
        showMessage('Toy updated successfully!')
        setEditingProduct(null)
      } else {
        await api.createProduct(productData)
        showMessage('Toy added successfully!')
      }
      fetchProductsForTab('toys')
      setToysForm({
        name: '',
        subcategory: 'educational',
        description: '',
        price: '',
        image: null,
        imagePreview: '',
        age_group: '5-10',
        stock: 10
      })
    } catch (error) {
      console.error('Error adding product:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Error adding product. Please try again.'
      showMessage(errorMsg, true)
    }
  }

  return (
    <div className="admin-page">
      <div className="container">
        <h1 className="admin-title">Admin Panel</h1>
        <p className="admin-subtitle">Manage Products</p>

        {successMessage && (
          <div className="message success-message">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="message error-message">{errorMessage}</div>
        )}

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'clothing' ? 'active' : ''}`}
            onClick={() => setActiveTab('clothing')}
          >
            Clothing
          </button>
          <button
            className={`admin-tab ${activeTab === 'pooja' ? 'active' : ''}`}
            onClick={() => setActiveTab('pooja')}
          >
            Pooja Items
          </button>
          <button
            className={`admin-tab ${activeTab === 'toys' ? 'active' : ''}`}
            onClick={() => setActiveTab('toys')}
          >
            Toys
          </button>
          <button
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        <div className="admin-content">
          {['clothing', 'pooja', 'toys'].includes(activeTab) && (
            <div className="admin-products-list" style={{ marginBottom: 18 }}>
              <h3>Existing Items</h3>
              <div className="products-list">
                {productsList.map(p => (
                  <div key={p.id} className="admin-product-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <img src={p.image_url || 'https://via.placeholder.com/80'} alt={p.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                      <div>
                        <strong>{p.name}</strong>
                        <div style={{ color: '#666', fontSize: 13 }}>{p.subcategory} • ₹{p.price}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => startEditProduct(p)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'clothing' && (
            <div className="admin-section">
              <h2>Add Clothing Item</h2>
              <form onSubmit={handleClothingSubmit} className="admin-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={clothingForm.name}
                    onChange={(e) => setClothingForm({ ...clothingForm, name: e.target.value })}
                    placeholder="e.g., Silk Saree - Traditional Red"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      required
                      value={clothingForm.subcategory}
                      onChange={(e) => setClothingForm({ ...clothingForm, subcategory: e.target.value })}
                    >
                      {clothingSubcategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Size *</label>
                    <select
                      required
                      value={clothingForm.size}
                      onChange={(e) => setClothingForm({ ...clothingForm, size: e.target.value })}
                    >
                      {clothingSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    value={clothingForm.description}
                    onChange={(e) => setClothingForm({ ...clothingForm, description: e.target.value })}
                    rows="3"
                    placeholder="Product description..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={clothingForm.price}
                      onChange={(e) => setClothingForm({ ...clothingForm, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={clothingForm.stock}
                      onChange={(e) => setClothingForm({ ...clothingForm, stock: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Product Image *</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      id="clothing-image"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'clothing')}
                      className="image-input"
                    />
                    <label htmlFor="clothing-image" className="image-upload-label">
                      {clothingForm.imagePreview ? (
                        <div className="image-preview-container">
                          <img src={clothingForm.imagePreview} alt="Preview" className="image-preview" />
                          <div className="image-overlay">
                            <span>Click to change image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="image-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.2 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14.2 2Z" fill="#D4AF37" opacity="0.2"/>
                            <path d="M14 2V8H20" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14.2 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14.2 2Z" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 12L10.5 14.5L16 9" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Click to upload image</span>
                          <small>PNG, JPG, GIF up to 5MB</small>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Add Clothing Item</button>
              </form>
            </div>
          )}

          {activeTab === 'pooja' && (
            <div className="admin-section">
              <h2>Add Pooja Item</h2>
              <form onSubmit={handlePoojaSubmit} className="admin-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={poojaForm.name}
                    onChange={(e) => setPoojaForm({ ...poojaForm, name: e.target.value })}
                    placeholder="e.g., Brass Ganesha Idol"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      required
                      value={poojaForm.subcategory}
                      onChange={(e) => setPoojaForm({ ...poojaForm, subcategory: e.target.value })}
                    >
                      {poojaSubcategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={poojaForm.stock}
                      onChange={(e) => setPoojaForm({ ...poojaForm, stock: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    value={poojaForm.description}
                    onChange={(e) => setPoojaForm({ ...poojaForm, description: e.target.value })}
                    rows="3"
                    placeholder="Product description..."
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={poojaForm.price}
                    onChange={(e) => setPoojaForm({ ...poojaForm, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Product Image *</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      id="pooja-image"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'pooja')}
                      className="image-input"
                    />
                    <label htmlFor="pooja-image" className="image-upload-label">
                      {poojaForm.imagePreview ? (
                        <div className="image-preview-container">
                          <img src={poojaForm.imagePreview} alt="Preview" className="image-preview" />
                          <div className="image-overlay">
                            <span>Click to change image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="image-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.2 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14.2 2Z" fill="#D4AF37" opacity="0.2"/>
                            <path d="M14 2V8H20" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14.2 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14.2 2Z" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 12L10.5 14.5L16 9" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Click to upload image</span>
                          <small>PNG, JPG, GIF up to 5MB</small>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Add Pooja Item</button>
              </form>
            </div>
          )}

          {activeTab === 'toys' && (
            <div className="admin-section">
              <h2>Add Toy</h2>
              <form onSubmit={handleToysSubmit} className="admin-form">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={toysForm.name}
                    onChange={(e) => setToysForm({ ...toysForm, name: e.target.value })}
                    placeholder="e.g., STEM Building Blocks"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      required
                      value={toysForm.subcategory}
                      onChange={(e) => setToysForm({ ...toysForm, subcategory: e.target.value })}
                    >
                      {toysSubcategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Age Group *</label>
                    <select
                      required
                      value={toysForm.age_group}
                      onChange={(e) => setToysForm({ ...toysForm, age_group: e.target.value })}
                    >
                      {toysAgeGroups.map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    value={toysForm.description}
                    onChange={(e) => setToysForm({ ...toysForm, description: e.target.value })}
                    rows="3"
                    placeholder="Product description..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={toysForm.price}
                      onChange={(e) => setToysForm({ ...toysForm, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={toysForm.stock}
                      onChange={(e) => setToysForm({ ...toysForm, stock: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Product Image *</label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      id="toys-image"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'toys')}
                      className="image-input"
                    />
                    <label htmlFor="toys-image" className="image-upload-label">
                      {toysForm.imagePreview ? (
                        <div className="image-preview-container">
                          <img src={toysForm.imagePreview} alt="Preview" className="image-preview" />
                          <div className="image-overlay">
                            <span>Click to change image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="image-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.2 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14.2 2Z" fill="#D4AF37" opacity="0.2"/>
                            <path d="M14 2V8H20" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14.2 2H6C4.89 2 4 2.89 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14.2 2Z" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 12L10.5 14.5L16 9" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Click to upload image</span>
                          <small>PNG, JPG, GIF up to 5MB</small>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Add Toy</button>
              </form>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="admin-section">
              <h2>Orders Received</h2>
              <div style={{ marginBottom: 16 }}>
                <button className="btn btn-secondary" onClick={fetchOrdersList}>Refresh Orders</button>
              </div>
              <div className="orders-grid">
                {ordersList.map(o => (
                  <div key={o.id} className={`admin-order-card ${expandedOrder === o.id ? 'expanded' : ''}`}>
                    <div className="admin-order-card-header" onClick={() => toggleOrder(o.id)}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <strong>Order #{o.id}</strong>
                          <div className="muted" style={{ fontSize: 13, marginLeft: 6 }}>{new Date(o.created_at || o.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <div><strong>Customer:</strong> {o.customer_name}</div>
                          <div className="muted" style={{ fontSize: 13 }}>{o.email} • {o.phone}</div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {orderStatusBadge(o)}
                        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>Tap to view</div>
                      </div>
                    </div>

                    {expandedOrder === o.id && (
                      <div className="admin-order-card-body" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-order-left">
                          <div className="muted"><strong>Address:</strong> {o.address}</div>
                          <div style={{ marginTop: 12 }}>
                            <h4 style={{ margin: '6px 0' }}>Items</h4>
                            {renderOrderItems(o.items)}
                          </div>
                        </div>
                        <div className="admin-order-right">
                          <div className="order-summary">
                            <div style={{ fontSize: 12, color: '#6b7280' }}>Total</div>
                            <div className="order-total" style={{ fontSize: 20, marginTop: 6 }}>₹{o.total_amount}</div>
                            <div style={{ marginTop: 8 }}>{orderStatusBadge(o)}</div>
                          </div>

                          <div className="shipment-form">
                            <label className="shipment-label">Courier</label>
                            <input className="shipment-input" type="text" value={(shipmentStates[o.id] && shipmentStates[o.id].courier_name) || ''} onChange={(e) => setShipmentStates(prev => ({ ...prev, [o.id]: { ...(prev[o.id] || {}), courier_name: e.target.value } }))} />

                            <label className="shipment-label">Tracking #</label>
                            <input className="shipment-input" type="text" value={(shipmentStates[o.id] && shipmentStates[o.id].tracking_number) || ''} onChange={(e) => setShipmentStates(prev => ({ ...prev, [o.id]: { ...(prev[o.id] || {}), tracking_number: e.target.value } }))} />

                            <button className="shipment-btn" onClick={() => markOrderShipped(o.id)}>{o.shipment ? 'Update Shipment' : 'Mark as Shipped'}</button>

                            {o.shipment && o.shipment.tracking_number && (
                              <div style={{ marginTop: 10 }} className="muted">Shipped via {o.shipment.courier_name || '—'} • Tracking: <a href={`https://www.google.com/search?q=${encodeURIComponent(o.shipment.tracking_number)}`} target="_blank" rel="noreferrer">{o.shipment.tracking_number}</a></div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'users' && (
            <div className="admin-section">
              <h2>Users</h2>
              <div style={{ marginBottom: 16 }}>
                <button className="btn btn-secondary" onClick={fetchUsersList}>Refresh Users</button>
              </div>
              <div className="users-list">
                {usersList.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #f5f5f5' }}>
                    <div>
                      <strong>{u.name}</strong>
                      <div className="muted">{u.email}  {u.phone}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {u.is_admin ? (
                        <button className="btn btn-danger" onClick={() => demoteUser(u.id)}>Demote</button>
                      ) : (
                        <button className="btn btn-primary" onClick={() => promoteUser(u.id)}>Promote</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin

