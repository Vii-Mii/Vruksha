import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import OnlineServices from './pages/OnlineServices'
import CateringServices from './pages/CateringServices'
import BeauticianServices from './pages/BeauticianServices'
import PoojaServices from './pages/PoojaServices'
import FlowerDecoration from './pages/FlowerDecoration'
import TuitionServices from './pages/TuitionServices'
import ClothingStore from './pages/ClothingStore'
import ToysStore from './pages/ToysStore'
import ProductDetail from './pages/ProductDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/online-services" element={<OnlineServices />} />
              <Route path="/catering-services" element={<CateringServices />} />
              <Route path="/beautician-services" element={<BeauticianServices />} />
              <Route path="/pooja-services" element={<PoojaServices />} />
              <Route path="/flower-decoration" element={<FlowerDecoration />} />
              <Route path="/tuition-services" element={<TuitionServices />} />
              <Route path="/clothing-store" element={<ClothingStore />} />
              <Route path="/toys-store" element={<ToysStore />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

