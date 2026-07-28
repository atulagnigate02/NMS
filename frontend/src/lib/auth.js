const TOKEN_KEY = 'nms-access-token'
const SESSION_KEY = 'nms-session'

export function getAccessToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

export function getSession() {
  if (typeof window === 'undefined') return { isAuthenticated: false, email: '', permissions: [] }
  const cached = window.localStorage.getItem(SESSION_KEY)
  if (!cached) return { isAuthenticated: false, email: '', permissions: [] }
  return JSON.parse(cached)
}

export function setSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
  clearAccessToken()
}

export function logout() {
  clearSession()
}
