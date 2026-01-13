// API client with axios interceptors for token refresh
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from '../utils/tokenStorage'
import type { RefreshResponse } from '../types/auth.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false
let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: Error) => void
}> = []

// Process queued requests after token refresh
const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error)
        } else {
            promise.resolve(token!)
        }
    })
    failedQueue = []
}

// Request interceptor - attach access token to requests
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = tokenStorage.getAccessToken()
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${token}`
                            }
                            resolve(api(originalRequest))
                        },
                        reject: (err: Error) => reject(err),
                    })
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshToken = tokenStorage.getRefreshToken()

            if (!refreshToken) {
                // No refresh token, clear everything and redirect to login
                tokenStorage.clearTokens()
                window.location.href = '/login'
                return Promise.reject(error)
            }

            try {
                // Call refresh endpoint
                const response = await axios.post<RefreshResponse>(
                    `${API_BASE_URL}/auth/refresh-token`,
                    { refreshToken }
                )

                const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data

                // Store new tokens
                tokenStorage.setTokens({
                    accessToken,
                    refreshToken: newRefreshToken,
                    expiresAt: tokenStorage.calculateExpiresAt(expiresIn),
                })

                // Update authorization header
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`
                }

                // Process queued requests
                processQueue(null, accessToken)

                return api(originalRequest)
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                processQueue(refreshError as Error, null)
                tokenStorage.clearTokens()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

// Export typed request helpers
export const apiClient = {
    get: <T>(url: string, config?: object) => api.get<T>(url, config).then((res) => res.data),
    post: <T>(url: string, data?: unknown, config?: object) => api.post<T>(url, data, config).then((res) => res.data),
    put: <T>(url: string, data?: unknown, config?: object) => api.put<T>(url, data, config).then((res) => res.data),
    patch: <T>(url: string, data?: unknown, config?: object) => api.patch<T>(url, data, config).then((res) => res.data),
    delete: <T>(url: string, config?: object) => api.delete<T>(url, config).then((res) => res.data),
}
