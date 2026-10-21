import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3500'

// Every request sends the auth cookie; the backend identifies the user from it.
export const api = axios.create({ baseURL: API_URL, withCredentials: true })

let unauthorizedHandler = null

// Registered once by the app shell: called when any request comes back 401.
export const onUnauthorized = (handler) => {
  unauthorizedHandler = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthHandler) {
      unauthorizedHandler?.(error.response.data?.message)
    }
    return Promise.reject(error)
  },
)

// Human-readable message for a failed request.
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (axios.isCancel(error)) return null
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.request && !error.response) return "Can't reach the server. Check your connection and try again."
  return fallback
}
