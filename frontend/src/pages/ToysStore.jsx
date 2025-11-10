import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, cartApi } from '../utils/api'
import { addToCart, getCart } from '../utils/cart'
import { useAuth } from '../contexts/AuthContext'
import './StorePage.css'

const ToysStore = () => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [filters, setFilters] = useState({
    category: '',
    ageGroup: ''
  })
  const auth = useAuth()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts('toys')
        setProducts(data)
        setFilteredProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
        // Fallback data
        const fallback = [
          { id: 1, name: 'STEM Building Blocks', category: 'toys', subcategory: 'educational', description: 'Educational building blocks for creative learning', price: 899, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', age_group: '5-10' },
          { id: 2, name: 'Remote Control Car', category: 'toys', subcategory: 'rc_cars', description: 'High-speed RC car with remote control', price: 1299, image_url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400', age_group: '8+' },
          { id: 3, name: 'Chess Board Set', category: 'toys', subcategory: 'board_games', description: 'Premium wooden chess board with pieces', price: 599, image_url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400', age_group: '10+' },
          { id: 4, name: 'Soft Teddy Bear', category: 'toys', subcategory: 'soft_toys', description: 'Cuddly soft teddy bear - perfect gift', price: 499, image_url: 'https://images.unsplash.com/photo-1530325551448-e3bfad6e1e0a?w=400', age_group: '0+' },
          { id: 5, name: 'Puzzle Set - 1000 Pieces', category: 'toys', subcategory: 'board_games', description: 'Challenging 1000-piece jigsaw puzzle', price: 699, image_url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400', age_group: '12+' },
          { id: 6, name: 'Action Figure Set', category: 'toys', subcategory: 'action_figures', description: 'Collection of superhero action figures', price: 899, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', age_group: '6+' },
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
    
    if (filters.ageGroup) {
      filtered = filtered.filter(p => {
        const age = filters.ageGroup
        if (age === '0-5') return p.age_group.includes('0') || p.age_group.includes('3') || p.age_group.includes('5')
        if (age === '5-10') return p.age_group.includes('5') || p.age_group.includes('8') || p.age_group.includes('10')
        if (age === '10+') return p.age_group.includes('10') || p.age_group.includes('12')
        return true
      })
    }
    
    setFilteredProducts(filtered)
  }, [filters, products])

  const handleAddToCart = (product) => {
    addToCart({ ...product, quantity: 1 })
    alert('Item added to cart!')
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
    { value: 'educational', label: 'Educational Toys' },
    { value: 'rc_cars', label: 'RC Cars & Remote Control' },
    { value: 'board_games', label: 'Board Games & Puzzles' },
    { value: 'action_figures', label: 'Action Figures' },
    { value: 'soft_toys', label: 'Soft Toys' },
    { value: 'outdoor', label: 'Outdoor Toys' }
  ]

  return (
    <div className="store-page toys-store-page">
      <div className="container">
        <h1 className="page-title">Toys Store</h1>
        <p className="page-subtitle">Fun and educational toys for all ages</p>

        <div className="store-intro">
          <p>Explore our wide range of toys for children of all ages. From educational toys and STEM kits to 
          fun board games and action figures, we offer quality toys that entertain, educate, and inspire creativity.</p>
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
              <label>Age Group</label>
              <select
                value={filters.ageGroup}
                onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}
              >
                <option value="">All Ages</option>
                <option value="0-5">0-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setFilters({ category: '', ageGroup: '' })}
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
                      <img src={product.image_url || 'https://via.placeholder.com/300'} alt={product.name} />
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-category">{product.subcategory}</p>
                      <p className="product-description">{product.description}</p>
                      <div className="product-meta">
                        <span className="product-age">Age: {product.age_group}</span>
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

export default ToysStore

