// Simple password strength estimator
export function estimatePassword(password) {
  if (!password) return { score: 0, label: 'Too short', isStrong: false }
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  let label = 'Weak'
  let isStrong = false
  if (score <= 2) {
    label = 'Weak'
  } else if (score <= 4) {
    label = 'Medium'
  } else {
    label = 'Strong'
    isStrong = true
  }

  return { score, label, isStrong }
}
