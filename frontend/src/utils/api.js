import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

export const api = {
  getProducts: async (category = null) => {
    const url = category ? `${API_BASE_URL}/products?category=${category}` : `${API_BASE_URL}/products`
    const response = await axios.get(url)
    return response.data
  },

  getProduct: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`)
    return response.data
  },

  getProductReviews: async (productId) => {
    const response = await axios.get(`${API_BASE_URL}/products/${productId}/reviews`)
    return response.data
  },

  getServices: async (category = null) => {
    const url = category ? `${API_BASE_URL}/services?category=${category}` : `${API_BASE_URL}/services`
    const response = await axios.get(url)
    return response.data
  },

  createBooking: async (bookingData) => {
    const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData)
    return response.data
  },

  createInquiry: async (inquiryData) => {
    const response = await axios.post(`${API_BASE_URL}/inquiries`, inquiryData)
    return response.data
  },

  createOrder: async (orderData) => {
    const response = await axios.post(`${API_BASE_URL}/orders`, orderData)
    return response.data
  },

  createOrderWithAuth: async (orderData, token) => {
    const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  getUserOrders: async (token) => {
    const response = await axios.get(`${API_BASE_URL}/orders/user`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Payments - Razorpay QR
  createRazorpayQR: async (amount, metadata, token) => {
    const response = await axios.post(`${API_BASE_URL}/payments/create_razorpay_qr`, { amount, metadata }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  verifyPayment: async (paymentId, token) => {
    const response = await axios.get(`${API_BASE_URL}/payments/verify?payment_id=${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  closeRazorpayQR: async (paymentId, token) => {
    const response = await axios.post(`${API_BASE_URL}/payments/close`, { payment_id: paymentId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  createProduct: async (productData) => {
    const response = await axios.post(`${API_BASE_URL}/products`, productData)
    return response.data
  }

  ,
  createReview: async (productId, payload, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await axios.post(`${API_BASE_URL}/products/${productId}/reviews`, payload, { headers })
    return response.data
  }

  ,
  updateProduct: async (productId, productData) => {
    const response = await axios.put(`${API_BASE_URL}/products/${productId}`, productData)
    return response.data
  },

  deleteProduct: async (productId) => {
    const response = await axios.delete(`${API_BASE_URL}/products/${productId}`)
    return response.data
  }
}

// Admin/order related APIs
export const adminApi = {
  listOrders: async () => {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await axios.get(`${API_BASE_URL}/admin/orders`, { headers })
    return response.data
  },

  createShipment: async (payload) => {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await axios.post(`${API_BASE_URL}/admin/shipments`, payload, { headers })
    return response.data
  },

  listShipments: async () => {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await axios.get(`${API_BASE_URL}/admin/shipments`, { headers })
    return response.data
  }
}

// Admin user management
adminApi.listUsers = async () => {
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const response = await axios.get(`${API_BASE_URL}/admin/users`, { headers })
  return response.data
}

adminApi.promoteUser = async (userId) => {
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const response = await axios.post(`${API_BASE_URL}/admin/users/${userId}/promote`, null, { headers })
  return response.data
}

adminApi.demoteUser = async (userId) => {
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const response = await axios.post(`${API_BASE_URL}/admin/users/${userId}/demote`, null, { headers })
  return response.data
}

adminApi.createVariant = async (productId, payload) => {
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const response = await axios.post(`${API_BASE_URL}/admin/products/${productId}/variants`, payload, { headers })
  return response.data
}

// Cart endpoints
export const cartApi = {
  getCart: async (token) => {
    const response = await axios.get(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  setCart: async (items, token) => {
    const response = await axios.post(`${API_BASE_URL}/cart`, { items }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  clearCart: async (token) => {
    const response = await axios.delete(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}

