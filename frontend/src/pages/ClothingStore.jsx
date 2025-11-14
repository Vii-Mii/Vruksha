import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, cartApi } from '../utils/api'
import { addToCart, getCart } from '../utils/cart'
import { useAuth } from '../contexts/AuthContext'
import './StorePage.css'

const ClothingStore = () => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    size: ''
  })
  const auth = useAuth()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts('clothing')
        setProducts(data)
        setFilteredProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
        // Fallback data
        const fallback = [
          { id: 1, name: 'Silk Saree - Traditional Red', category: 'clothing', subcategory: 'sarees', description: 'Beautiful traditional red silk saree with golden border', price: 3500, images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400'], size: 'Free Size' },
          { id: 2, name: 'Designer Kurti Set - Blue', category: 'clothing', subcategory: 'kurtis', description: 'Elegant blue designer kurti with matching dupatta', price: 1800, images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'], size: 'M' },
          { id: 3, name: 'Anarkali Suit - Pink', category: 'clothing', subcategory: 'ethnic_wear', description: 'Stylish pink anarkali suit with intricate embroidery', price: 2500, images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400'], size: 'L' },
          { id: 4, name: 'Western Dress - Floral', category: 'clothing', subcategory: 'western', description: 'Modern floral print western dress', price: 1200, images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'], size: 'M' },
          { id: 5, name: 'Banarasi Saree - Green', category: 'clothing', subcategory: 'sarees', description: 'Luxurious Banarasi silk saree in emerald green', price: 4500, images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400'], size: 'Free Size' },
          { id: 6, name: 'Kurta Set - White', category: 'clothing', subcategory: 'kurtis', description: 'Elegant white kurta with embroidered details', price: 1500, images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'], size: 'S' },
        ]
        setProducts(fallback)
        setFilteredProducts(fallback)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    let filtered = [...products]
    
    if (filters.category) {
      filtered = filtered.filter(p => p.subcategory === filters.category)
    }
    
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number)
      if (max) {
        filtered = filtered.filter(p => p.price >= min && p.price <= max)
      } else {
        filtered = filtered.filter(p => p.price >= min)
      }
    }
    
    if (filters.size) {
      filtered = filtered.filter(p => p.size === filters.size || p.size === 'Free Size')
    }
    
    setFilteredProducts(filtered)
  }, [filters, products])

  const handleAddToCart = (product) => {
    addToCart({ ...product, quantity: 1 })
    alert('Item added to cart!')
    // If the user is authenticated, sync the cart to server
    if (auth && auth.token) {
      ;(async () => {
        try {
          const items = getCart()
          await cartApi.setCart(items, auth.token)
        } catch (err) {
          console.error('Failed to sync cart to server:', err)
        }
      })()
    }
  }

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'sarees', label: 'Sarees' },
    { value: 'kurtis', label: 'Kurtis & Kurta Sets' },
    { value: 'ethnic_wear', label: 'Ethnic Wear' },
    { value: 'western', label: 'Western Wear' }
  ]

  const sizes = ['S', 'M', 'L', 'XL', 'Free Size']

  return (
    <div className="store-page clothing-store-page">
      <div className="container">
        <h1 className="page-title">Clothing Store</h1>
        <p className="page-subtitle">Fashionable clothing for women</p>

        <div className="store-intro">
          <p>Discover our curated collection of fashionable women's clothing. From traditional sarees and kurtis 
          to modern western wear, we offer quality clothing at affordable prices with the latest trends and styles.</p>
        </div>

        <div className="store-layout">
          <aside className="filters-sidebar">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
              >
                <option value="">All Prices</option>
                <option value="0-1500">Under ₹1,500</option>
                <option value="1500-2500">₹1,500 - ₹2,500</option>
                <option value="2500-3500">₹2,500 - ₹3,500</option>
                <option value="3500-999999">Above ₹3,500</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Size</label>
              <select
                value={filters.size}
                onChange={(e) => setFilters({ ...filters, size: e.target.value })}
              >
                <option value="">All Sizes</option>
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setFilters({ category: '', priceRange: '', size: '' })}
            >
              Clear Filters
            </button>
          </aside>

          <div className="products-section">
            <div className="products-header">
              <p>{filteredProducts.length} products found</p>
            </div>
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-card card">
                  <Link to={`/product/${product.id}`} className="product-link">
                    <div className="product-image">
                      <img src={(product.images && product.images[0]) || 'https://via.placeholder.com/300'} alt={product.name} />
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-category">{product.subcategory}</p>
                      <p className="product-description">{product.description}</p>
                      <div className="product-meta">
                        <span className="product-size">Size: {product.selectedSize || (product.variants && product.variants[0] && product.variants[0].sizes && product.variants[0].sizes[0] ? product.variants[0].sizes[0].size : product.size)}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="product-footer">
                    <span className="price">₹{product.price}</span>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="no-products">
                <p>No products found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClothingStore

