export const getCart = () => {
  return JSON.parse(localStorage.getItem('cart') || '[]')
}

export const addToCart = (product) => {
  const cart = getCart()
  const existingItem = cart.find(item => item.id === product.id && item.size === product.size)
  
  if (existingItem) {
    existingItem.quantity += product.quantity || 1
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      size: product.size || null,
      quantity: product.quantity || 1
    })
  }
  
  localStorage.setItem('cart', JSON.stringify(cart))
  return cart
}

// Merge two cart arrays (serverCart takes priority for quantities but we'll sum where matching)
export const mergeCarts = (localCart, serverCart) => {
  const merged = [...serverCart]
  for (const item of localCart) {
    const found = merged.find(i => i.id === item.id && i.size === item.size)
    if (found) {
      found.quantity = (found.quantity || 0) + (item.quantity || 1)
    } else {
      merged.push(item)
    }
  }
  return merged
}

export const setCartLocal = (items) => {
  localStorage.setItem('cart', JSON.stringify(items || []))
  try {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: items || [] } }))
  } catch (e) {
    // ignore in non-browser environments
  }
}

export const removeFromCart = (productId, size = null) => {
  const cart = getCart()
  const filtered = cart.filter(item => !(item.id === productId && item.size === size))
  localStorage.setItem('cart', JSON.stringify(filtered))
  return filtered
}

export const updateCartItemQuantity = (productId, quantity, size = null) => {
  const cart = getCart()
  const item = cart.find(item => item.id === productId && item.size === size)
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId, size)
    }
    item.quantity = quantity
  }
  localStorage.setItem('cart', JSON.stringify(cart))
  return cart
}

export const clearCart = () => {
  localStorage.removeItem('cart')
}

export const getCartTotal = () => {
  const cart = getCart()
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

export const getCartCount = () => {
  const cart = getCart()
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

