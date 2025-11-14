import React, { useState, useEffect } from 'react'
import { api, adminApi } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, UserCheck, UserMinus, ShieldCheck } from 'lucide-react'
import Notifications from '../components/Notifications'
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
    // parent image/size/stock removed - variants carry these
  })

  // For per-color variants in clothing
  const [clothingColors, setClothingColors] = useState([
    { name: 'Default', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'Free Size', stock: 5 }] }
  ])
  // For pooja and toys variants (same UI as clothing)
  const [poojaColors, setPoojaColors] = useState([
    { name: 'Default', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'Free Size', stock: 5 }] }
  ])
  const [toysColors, setToysColors] = useState([
    { name: 'Default', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'Free Size', stock: 5 }] }
  ])

  const [poojaForm, setPoojaForm] = useState({
    name: '',
    subcategory: 'idols',
    description: '',
    price: '',
    // parent image/stock removed
  })

  const [toysForm, setToysForm] = useState({
    name: '',
    subcategory: 'educational',
    description: '',
    price: '',
    // parent image/stock removed
    age_group: '5-10'
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
      })
      // load variants into clothingColors for editing if present
      if (product.variants && Array.isArray(product.variants) && product.variants.length) {
        // Preserve the variant id so updates can reference existing variants.
        setClothingColors(product.variants.map(v => ({
          id: v.id,
          name: v.color || 'Variant',
          hex: v.color_code || '#cccccc',
          image: null,
          imagePreview: (v.images && v.images[0]) || '',
          // sizes: array of objects { size, stock }
          sizes: (v.sizes || []).map(s => ({ size: s.size, stock: s.stock || 0 }))
        })))
      }
    } else if (product.category === 'pooja_items') {
      setPoojaForm({
        name: product.name || '',
        subcategory: product.subcategory || 'idols',
        description: product.description || '',
        price: product.price || '',
        // parent image/stock removed
      })
      if (product.variants && Array.isArray(product.variants) && product.variants.length) {
        setPoojaColors(product.variants.map(v => ({
          id: v.id,
          name: v.color || 'Variant',
          hex: v.color_code || '#cccccc',
          image: null,
          imagePreview: (v.images && v.images[0]) || '',
          sizes: (v.sizes || []).map(s => ({ size: s.size, stock: s.stock || 0 }))
        })))
      }
    } else if (product.category === 'toys') {
      setToysForm({
        name: product.name || '',
        subcategory: product.subcategory || 'educational',
        description: product.description || '',
        price: product.price || '',
        age_group: product.age_group || '5-10'
      })
      if (product.variants && Array.isArray(product.variants) && product.variants.length) {
        setToysColors(product.variants.map(v => ({
          id: v.id,
          name: v.color || 'Variant',
          hex: v.color_code || '#cccccc',
          image: null,
          imagePreview: (v.images && v.images[0]) || '',
          sizes: (v.sizes || []).map(s => ({ size: s.size, stock: s.stock || 0 }))
        })))
      }
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
              <img src={((it.images && it.images[0]) || it.selectedImage) || 'https://via.placeholder.com/80'} alt={it.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
              <div>
                <strong>{it.name}</strong>
                <div style={{ color: '#666', fontSize: 13 }}>{(it.subcategory || '')} • ₹{it.price}</div>
                {it.selectedColor && (
                  <div style={{ marginTop: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, background: it.selectedColor.hex || '#ccc', borderRadius: 4, marginRight: 8, verticalAlign: 'middle' }} />{it.selectedColor.name}</div>
                )}
                {!it.selectedColor && it.variant_color && (
                  <div style={{ marginTop: 6 }}>Color: {it.variant_color}</div>
                )}
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
    if (!file) return

    // Validate file type
    if (!file.type || !file.type.startsWith('image/')) {
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

      // formType like 'clothing-color-0' or 'pooja-color-1' or 'toys-color-2'
      if (formType && formType.includes('-color-')) {
        const parts = formType.split('-color-')
        const prefix = parts[0]
        const idx = parseInt(parts[1], 10)
        if (prefix === 'clothing') {
          setClothingColors(prev => {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], image: file, imagePreview }
            return copy
          })
          return
        }
        if (prefix === 'pooja') {
          setPoojaColors(prev => {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], image: file, imagePreview }
            return copy
          })
          return
        }
        if (prefix === 'toys') {
          setToysColors(prev => {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], image: file, imagePreview }
            return copy
          })
          return
        }
      }

      if (formType === 'toys') {
        setToysForm(prev => ({ ...prev, image: file, imagePreview }))
        return
      }

      // If no specific formType matched, do nothing but keep for future
    }

    reader.readAsDataURL(file)
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
      if (!clothingForm.name || !clothingForm.description || !clothingForm.price) {
        showMessage('Please fill in all required fields.', true)
        return
      }

      // Upload main product image and create product
      const productData = {
        name: clothingForm.name.trim(),
        category: 'clothing',
        subcategory: clothingForm.subcategory,
        description: clothingForm.description.trim(),
        price: parseFloat(clothingForm.price),
        // parent-level image/size/stock intentionally omitted
      }

      let createdProductId = null
      // If editing an existing product, build a PUT payload that includes variants
      if (editingProduct && editingProduct.id) {
        // Build full update payload including variants (uploads new variant images as needed)
        const payload = await buildProductUpdatePayload(productData, clothingColors, editingProduct)
        await api.updateProduct(editingProduct.id, payload)
        createdProductId = editingProduct.id
        showMessage('Clothing item updated successfully!')
        setEditingProduct(null)
      } else {
        const resp = await api.createProduct(productData)
        createdProductId = resp.id
        showMessage('Clothing item added successfully!')

        // Create variants for each color (upload color images first)
        for (let i = 0; i < clothingColors.length; i++) {
          const c = clothingColors[i]
          // upload color image if provided
          let colorImageUrl = null
          if (c.image) {
            colorImageUrl = await uploadImageToCloudinary(c.image)
          }
          // build payload matching VariantCreate: { color, color_code, images: [...], sizes: [{size, stock}, ...] }
          const variantPayload = {
            color: c.name || 'Variant',
            color_code: c.hex || null,
            images: colorImageUrl ? [colorImageUrl] : [],
            sizes: (c.sizes || []).map(s => (typeof s === 'string' ? { size: s, stock: 5 } : { size: s.size, stock: s.stock || 5 }))
          }
          try {
            await adminApi.createVariant(createdProductId, variantPayload)
          } catch (err) {
            console.warn('Failed to create variant for color', c.name, err)
          }
        }
      }
      fetchProductsForTab('clothing')
  setClothingForm({ name: '', subcategory: 'sarees', description: '', price: '' })
  setClothingColors([{ name: 'Default', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'Free Size', stock: 5 }] }])
    } catch (error) {
      console.error('Error adding product:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Error adding product. Please try again.'
      showMessage(errorMsg, true)
    }
  }

  // Helper: build a ProductUpdate payload including variants. Uploads any newly-selected images.
  // - productData: base product fields (name, category, subcategory, description, price, age_group)
  // - colorsState: clothingColors array; entries may include `id`, `name`, `hex`, `image` (File), `imagePreview`, `sizes` (array of { size, stock } or strings)
  // - existingProduct: the product object as fetched from server (used to preserve ids)
  const buildProductUpdatePayload = async (productData, colorsState, existingProduct) => {
    const payload = { ...productData }
    // include variants array
    const variants = []
    for (let i = 0; i < (colorsState || []).length; i++) {
      const c = colorsState[i]
      let images = []
      // If the admin selected a new File, upload and use its URL
      if (c.image) {
        try {
          const url = await uploadImageToCloudinary(c.image)
          if (url) images.push(url)
        } catch (err) {
          console.warn('Image upload failed for variant', c.name, err)
        }
      } else if (c.imagePreview) {
        // existing remote URL or data URL; prefer that
        images.push(c.imagePreview)
      }

      // Build sizes array: support sizes stored as strings or objects. Use sizeStocks if provided, otherwise default stock 5.
      const sizes = (c.sizes || []).map(s => {
        if (typeof s === 'string') {
          const stock = (c.sizeStocks && c.sizeStocks[s]) ? c.sizeStocks[s] : 5
          return { size: s, stock }
        }
        return { size: s.size, stock: s.stock || 5 }
      })

      const vObj = {
        color: c.name || 'Variant',
        color_code: c.hex || null,
        images,
        sizes,
      }
      if (c.id) vObj.id = c.id
      variants.push(vObj)
    }
    payload.variants = variants
    return payload
  }

  const handlePoojaSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!poojaForm.name || !poojaForm.description || !poojaForm.price) {
        showMessage('Please fill in all required fields.', true)
        return
      }

      // Upload image and get URL
      const productData = {
        name: poojaForm.name.trim(),
        category: 'pooja_items',
        subcategory: poojaForm.subcategory,
        description: poojaForm.description.trim(),
        price: parseFloat(poojaForm.price),
        // parent-level image/stock omitted
      }
      let createdProductId = null
      if (editingProduct && editingProduct.id) {
        const payload = await buildProductUpdatePayload(productData, poojaColors, editingProduct)
        await api.updateProduct(editingProduct.id, payload)
        createdProductId = editingProduct.id
        showMessage('Pooja item updated successfully!')
        setEditingProduct(null)
      } else {
        const resp = await api.createProduct(productData)
        createdProductId = resp.id
        showMessage('Pooja item added successfully!')

        // create variants
        for (let i = 0; i < poojaColors.length; i++) {
          const c = poojaColors[i]
          let colorImageUrl = null
          if (c.image) colorImageUrl = await uploadImageToCloudinary(c.image)
          const variantPayload = {
            color: c.name || 'Variant',
            color_code: c.hex || null,
            images: colorImageUrl ? [colorImageUrl] : [],
            sizes: (c.sizes || []).map(s => (typeof s === 'string' ? { size: s, stock: 5 } : { size: s.size, stock: s.stock || 5 }))
          }
          try { await adminApi.createVariant(createdProductId, variantPayload) } catch (err) { console.warn('Failed to create variant for color', c.name, err) }
        }
      }
      fetchProductsForTab('pooja')
      setPoojaForm({ name: '', subcategory: 'idols', description: '', price: '' })
      setPoojaColors([{ name: 'Default', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'Free Size', stock: 5 }] }])
    } catch (error) {
      console.error('Error adding product:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Error adding product. Please try again.'
      showMessage(errorMsg, true)
    }
  }

  const handleToysSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!toysForm.name || !toysForm.description || !toysForm.price) {
        showMessage('Please fill in all required fields.', true)
        return
      }

      // Upload image and get URL
      const productData = {
        name: toysForm.name.trim(),
        category: 'toys',
        subcategory: toysForm.subcategory,
        description: toysForm.description.trim(),
        price: parseFloat(toysForm.price),
        age_group: toysForm.age_group || null
      }
      let createdProductId = null
      if (editingProduct && editingProduct.id) {
        const payload = await buildProductUpdatePayload(productData, toysColors, editingProduct)
        await api.updateProduct(editingProduct.id, payload)
        createdProductId = editingProduct.id
        showMessage('Toy updated successfully!')
        setEditingProduct(null)
      } else {
        const resp = await api.createProduct(productData)
        createdProductId = resp.id
        showMessage('Toy added successfully!')

        for (let i = 0; i < toysColors.length; i++) {
          const c = toysColors[i]
          let colorImageUrl = null
          if (c.image) colorImageUrl = await uploadImageToCloudinary(c.image)
          const variantPayload = {
            color: c.name || 'Variant',
            color_code: c.hex || null,
            images: colorImageUrl ? [colorImageUrl] : [],
            sizes: (c.sizes || []).map(s => (typeof s === 'string' ? { size: s, stock: 5 } : { size: s.size, stock: s.stock || 5 }))
          }
          try { await adminApi.createVariant(createdProductId, variantPayload) } catch (err) { console.warn('Failed to create variant for color', c.name, err) }
        }
      }
      fetchProductsForTab('toys')
      setToysForm({ name: '', subcategory: 'educational', description: '', price: '', age_group: '5-10' })
      setToysColors([{ name: 'Default', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'Free Size', stock: 5 }] }])
    } catch (error) {
      console.error('Error adding product:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Error adding product. Please try again.'
      showMessage(errorMsg, true)
    }
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 className="admin-title">Admin Panel</h1>
            <p className="admin-subtitle">Manage Products</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Notifications />
          </div>
        </div>

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
                      <img src={(p.images && p.images[0]) || 'https://via.placeholder.com/80'} alt={p.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
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
                  {/* parent stock removed */}
                </div>
                {/* parent product image removed - upload per-variant instead */}
                <div className="form-group">
                  <label>Colors & Variants</label>
                  <div className="colors-list">
                    {clothingColors.map((c, idx) => (
                      <div key={idx} className="color-row">
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input type="text" value={c.name} onChange={(e) => setClothingColors(prev => { const p = [...prev]; p[idx].name = e.target.value; return p })} placeholder="Color name (e.g. Red)" />
                          <input type="color" value={c.hex} onChange={(e) => setClothingColors(prev => { const p = [...prev]; p[idx].hex = e.target.value; return p })} title="Color hex" />
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], `clothing-color-${idx}`)} />
                          {c.imagePreview ? <img src={c.imagePreview} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} /> : null}
                          <button type="button" className="btn btn-ghost" onClick={() => setClothingColors(prev => { const p = [...prev]; p.splice(idx,1); return p })}>Remove</button>
                        </div>
                        <div style={{ marginTop:8 }}>
                          <label style={{ fontSize:13, color:'#666' }}>Sizes</label>
                          <div style={{ display:'flex', gap:8, marginTop:6, alignItems: 'center' }}>
                            {clothingSizes.map(sz => {
                              const active = c.sizes && c.sizes.find(o => o.size === sz)
                              return (
                                <div key={sz} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <button type="button" className={`size-pill ${active ? 'active' : ''}`} onClick={() => setClothingColors(prev => {
                                    const p = [...prev];
                                    const cur = p[idx] || {};
                                    const existing = Array.isArray(cur.sizes) ? cur.sizes.slice() : [];
                                    const fi = existing.findIndex(o => o.size === sz);
                                    if (fi !== -1) existing.splice(fi, 1); else existing.push({ size: sz, stock: 5 });
                                    p[idx] = { ...cur, sizes: existing };
                                    return p;
                                  })}>{sz}</button>
                                  {active ? (
                                    <input type="number" min="0" value={active.stock} onChange={(e) => setClothingColors(prev => {
                                      const p = [...prev];
                                      const cur = p[idx] || {};
                                      const existing = (cur.sizes || []).map(o => ({ ...o }));
                                      const fi = existing.findIndex(o => o.size === sz);
                                      if (fi !== -1) existing[fi].stock = parseInt(e.target.value || '0', 10);
                                      p[idx] = { ...cur, sizes: existing };
                                      return p;
                                    })} style={{ width: 64, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd' }} />
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className="btn btn-outline" onClick={() => setClothingColors(prev => ([...prev, { name: 'New', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'S', stock: 5 }] }]))}>Add Color</button>
                    </div>
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
                {/* variant UI (colors & sizes) - same as clothing */}
                <div className="form-group">
                  <label>Colors & Variants</label>
                  <div className="colors-list">
                    {poojaColors.map((c, idx) => (
                      <div key={idx} className="color-row">
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input type="text" value={c.name} onChange={(e) => setPoojaColors(prev => { const p = [...prev]; p[idx].name = e.target.value; return p })} placeholder="Color name (e.g. Red)" />
                          <input type="color" value={c.hex} onChange={(e) => setPoojaColors(prev => { const p = [...prev]; p[idx].hex = e.target.value; return p })} title="Color hex" />
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], `pooja-color-${idx}`)} />
                          {c.imagePreview ? <img src={c.imagePreview} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} /> : null}
                          <button type="button" className="btn btn-ghost" onClick={() => setPoojaColors(prev => { const p = [...prev]; p.splice(idx,1); return p })}>Remove</button>
                        </div>
                        <div style={{ marginTop:8 }}>
                          <label style={{ fontSize:13, color:'#666' }}>Sizes</label>
                          <div style={{ display:'flex', gap:8, marginTop:6, alignItems: 'center' }}>
                            {clothingSizes.map(sz => {
                              const active = c.sizes && c.sizes.find(o => o.size === sz)
                              return (
                                <div key={sz} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <button type="button" className={`size-pill ${active ? 'active' : ''}`} onClick={() => setPoojaColors(prev => { const p = [...prev]; const cur = p[idx] || {}; const existing = Array.isArray(cur.sizes) ? cur.sizes.slice() : []; const fi = existing.findIndex(o => o.size === sz); if (fi !== -1) existing.splice(fi, 1); else existing.push({ size: sz, stock: 5 }); p[idx] = { ...cur, sizes: existing }; return p })}>{sz}</button>
                                  {active ? (
                                    <input type="number" min="0" value={active.stock} onChange={(e) => setPoojaColors(prev => { const p = [...prev]; const cur = p[idx] || {}; const existing = (cur.sizes || []).map(o => ({ ...o })); const fi = existing.findIndex(o => o.size === sz); if (fi !== -1) existing[fi].stock = parseInt(e.target.value || '0', 10); p[idx] = { ...cur, sizes: existing }; return p })} style={{ width: 64, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd' }} />
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 10 }}>
                      <button type="button" className="btn btn-outline" onClick={() => setPoojaColors(prev => ([...prev, { name: 'New', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'S', stock: 5 }] }]))}>Add Color</button>
                    </div>
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
                  {/* variant UI (colors & sizes) - same as clothing */}
                  <div className="form-group">
                    <label>Colors & Variants</label>
                    <div className="colors-list">
                      {toysColors.map((c, idx) => (
                        <div key={idx} className="color-row">
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input type="text" value={c.name} onChange={(e) => setToysColors(prev => { const p = [...prev]; p[idx].name = e.target.value; return p })} placeholder="Color name (e.g. Red)" />
                            <input type="color" value={c.hex} onChange={(e) => setToysColors(prev => { const p = [...prev]; p[idx].hex = e.target.value; return p })} title="Color hex" />
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], `toys-color-${idx}`)} />
                            {c.imagePreview ? <img src={c.imagePreview} alt="preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} /> : null}
                            <button type="button" className="btn btn-ghost" onClick={() => setToysColors(prev => { const p = [...prev]; p.splice(idx,1); return p })}>Remove</button>
                          </div>
                          <div style={{ marginTop:8 }}>
                            <label style={{ fontSize:13, color:'#666' }}>Sizes</label>
                            <div style={{ display:'flex', gap:8, marginTop:6, alignItems: 'center' }}>
                              {clothingSizes.map(sz => {
                                const active = c.sizes && c.sizes.find(o => o.size === sz)
                                return (
                                  <div key={sz} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <button type="button" className={`size-pill ${active ? 'active' : ''}`} onClick={() => setToysColors(prev => { const p = [...prev]; const cur = p[idx] || {}; const existing = Array.isArray(cur.sizes) ? cur.sizes.slice() : []; const fi = existing.findIndex(o => o.size === sz); if (fi !== -1) existing.splice(fi, 1); else existing.push({ size: sz, stock: 5 }); p[idx] = { ...cur, sizes: existing }; return p })}>{sz}</button>
                                    {active ? (
                                      <input type="number" min="0" value={active.stock} onChange={(e) => setToysColors(prev => { const p = [...prev]; const cur = p[idx] || {}; const existing = (cur.sizes || []).map(o => ({ ...o })); const fi = existing.findIndex(o => o.size === sz); if (fi !== -1) existing[fi].stock = parseInt(e.target.value || '0', 10); p[idx] = { ...cur, sizes: existing }; return p })} style={{ width: 64, padding: '4px 6px', borderRadius: 4, border: '1px solid #ddd' }} />
                                    ) : null}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 10 }}>
                        <button type="button" className="btn btn-outline" onClick={() => setToysColors(prev => ([...prev, { name: 'New', hex: '#cccccc', image: null, imagePreview: '', sizes: [{ size: 'S', stock: 5 }] }]))}>Add Color</button>
                      </div>
                    </div>
                  </div>
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
                    <label>Age Group</label>
                    <select value={toysForm.age_group} onChange={(e) => setToysForm({ ...toysForm, age_group: e.target.value })}>
                      {toysAgeGroups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Toys use per-variant images; product-level image upload removed */}
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
                  <div key={u.id} className="user-row">
                    <div className="user-left">
                      <div className="admin-avatar" aria-hidden>
                        <User size={28} />
                      </div>
                      <div className="user-meta">
                        <div className="user-name">
                          <strong>{u.name || '—'}</strong>
                          {u.is_admin && (
                            <span className="admin-badge" title="Administrator" aria-hidden>
                              <ShieldCheck size={12} />
                            </span>
                          )}
                        </div>
                        <div className="user-contact">
                          <span className="contact-item"><Mail size={14} /> <span className="muted contact-text">{u.email || '—'}</span></span>
                          <span className="contact-sep">•</span>
                          <span className="contact-item"><Phone size={14} /> <span className="muted contact-text">{u.phone || '—'}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="user-actions">
                      {u.is_admin ? (
                        <button className="icon-btn icon-btn-danger" title="Demote user" onClick={() => demoteUser(u.id)}>
                          <UserMinus size={16} />
                        </button>
                      ) : (
                        <button className="icon-btn" title="Promote to admin" onClick={() => promoteUser(u.id)}>
                          <UserCheck size={16} />
                        </button>
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

