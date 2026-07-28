import axios from 'axios'
import { clearSession, getAccessToken } from '@/lib/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    if (status === 401) {
      clearSession()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
        window.location.href = '/'
      }
    }

    const detail = error.response?.data?.detail
    let message = error.message

    if (typeof detail === 'string') {
      message = detail
    } else if (Array.isArray(detail)) {
      message = detail.map((item) => item.msg).join(', ')
    }

    return Promise.reject(new Error(message || `Request failed with status ${status ?? 'unknown'}`))
  },
)

export function extractErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}
