import type { AuthTokens } from '../types/auth.types'

const ACCESS_TOKEN_KEY = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'
const EXPIRES_AT_KEY = 'auth_expires_at'

// Token storage utilities with expiry tracking
export const tokenStorage = {
    // Store tokens
    setTokens(tokens: AuthTokens): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
        localStorage.setItem(EXPIRES_AT_KEY, tokens.expiresAt.toString())
    },

    // Get all tokens
    getTokens(): AuthTokens | null {
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
        const expiresAt = localStorage.getItem(EXPIRES_AT_KEY)

        if (!accessToken || !refreshToken || !expiresAt) {
            return null
        }

        return {
            accessToken,
            refreshToken,
            expiresAt: parseInt(expiresAt, 10),
        }
    },

    // Get access token only
    getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY)
    },

    // Get refresh token only
    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY)
    },

    // Clear all tokens
    clearTokens(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        localStorage.removeItem(EXPIRES_AT_KEY)
    },

    // Check if access token is expired (with 30s buffer)
    isAccessTokenExpired(): boolean {
        const expiresAt = localStorage.getItem(EXPIRES_AT_KEY)
        if (!expiresAt) return true

        const expiryTime = parseInt(expiresAt, 10)
        const bufferMs = 30 * 1000 // 30 seconds buffer
        return Date.now() >= expiryTime - bufferMs
    },

    // Check if we have a valid refresh token
    hasRefreshToken(): boolean {
        return !!localStorage.getItem(REFRESH_TOKEN_KEY)
    },

    // Calculate expiry timestamp from seconds
    calculateExpiresAt(expiresInSeconds: number): number {
        return Date.now() + expiresInSeconds * 1000
    },
}
