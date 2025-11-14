import { cartApi } from './api'

export const getCart = () => {
  return JSON.parse(localStorage.getItem('cart') || '[]')
}

export const addToCart = (product) => {
  const cart = getCart()
  const incomingSize = product.selectedSize ?? product.size ?? null
  const incomingVariantId = product.variant_id ?? null
  const existingItem = cart.find(
    (item) => item.id === product.id && (item.variant_id ?? null) === incomingVariantId && (item.size ?? null) === incomingSize
  )

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 0) + (product.quantity || 1)
  } else {
    cart.push({
      id: product.id,
      variant_id: incomingVariantId,
      variant_color: product.variant_color || null,
      // Persist selectedColor object when provided (name + hex) for richer UI
      selectedColor: product.selectedColor ? { name: product.selectedColor.name, hex: product.selectedColor.hex } : null,
      name: product.name,
      price: product.price,
      // prefer selectedImage (from UI) or first image in images[] returned by API
  // persist selectedImage and a normalized image_url derived from variant images
  image_url: product.selectedImage || (product.images && product.images[0]) || null,
      selectedImage: product.selectedImage || (product.images && product.images[0]) || null,
      size: incomingSize,
      quantity: product.quantity || 1
    })
  }

  localStorage.setItem('cart', JSON.stringify(cart))
  try {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: cart } }))
  } catch (e) {
    // ignore in non-browser environments
  }

  // If user is authenticated, try to sync to server (best-effort)
  const token = localStorage.getItem('token')
  if (token) {
    ;(async () => {
      try {
        await cartApi.setCart(cart, token)
      } catch (err) {
        console.error('Failed to sync cart on addToCart:', err)
      }
    })()
  }

  return cart
}

// Merge two cart arrays (serverCart takes priority for quantities but we'll sum where matching)
export const mergeCarts = (localCart, serverCart) => {
  const merged = [...serverCart]
  for (const item of localCart) {
    const itemSize = item.size ?? null
    const itemVariant = item.variant_id ?? null
    const found = merged.find(
      (i) => i.id === item.id && (i.variant_id ?? null) === itemVariant && (i.size ?? null) === itemSize
    )
    if (found) {
      found.quantity = (found.quantity || 0) + (item.quantity || 1)
    } else {
      // normalize size before pushing
      merged.push({ ...item, size: itemSize })
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
  const normalizedSize = size ?? null
  const filtered = cart.filter(item => !(item.id === productId && (item.size ?? null) === normalizedSize))
  localStorage.setItem('cart', JSON.stringify(filtered))
  try {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: filtered } }))
  } catch (e) {
    // ignore
  }

  const token = localStorage.getItem('token')
  if (token) {
    ;(async () => {
      try {
        await cartApi.setCart(filtered, token)
      } catch (err) {
        console.error('Failed to sync cart on removeFromCart:', err)
      }
    })()
  }

  return filtered
}

export const updateCartItemQuantity = (productId, quantity, size = null) => {
  const cart = getCart()
  const normalizedSize = size ?? null
  const item = cart.find(item => item.id === productId && (item.size ?? null) === normalizedSize)
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId, size)
    }
    item.quantity = quantity
  }
  localStorage.setItem('cart', JSON.stringify(cart))
  try {
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: cart } }))
  } catch (e) {
    // ignore
  }

  const token = localStorage.getItem('token')
  if (token) {
    ;(async () => {
      try {
        await cartApi.setCart(cart, token)
      } catch (err) {
        console.error('Failed to sync cart on updateCartItemQuantity:', err)
      }
    })()
  }

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

