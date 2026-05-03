import axios from 'axios'

// Empty string → relative URLs → Vite proxy forwards /api/* to the gateway.
// Set VITE_API_BASE_URL to a full origin only when deploying without the proxy.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Re-export for convenience so callers don't need to import axios directly.
export { axios }
