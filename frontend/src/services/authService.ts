import { apiClient } from './api'
import { tokenStorage } from '../utils/tokenStorage'
import type { User, AuthResponse, RefreshResponse, SignUpData } from '../types/auth.types'

// Authentication service with full token handling
export const authService = {
    // Login with phone and OTP
    async login(credentials: { phone: string; otp: string }): Promise<{ user: User }> {
        const response = await apiClient.post<AuthResponse>('/auth/verify-otp', {
            mobileNumber: credentials.phone,
            otp: credentials.otp,
        })

        // Store tokens
        tokenStorage.setTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresAt: tokenStorage.calculateExpiresAt(response.expiresIn),
        })

        return { user: response.user }
    },

    // Sign up new user
    async signUp(data: SignUpData): Promise<{ user: User; message: string }> {
        const response = await apiClient.post<{ user: User; message: string }>('/users/signup', {
            name: data.name,
            mobileNumber: data.phone,
            email: data.email,
            role: data.role,
        })

        // Note: signup doesn't return tokens - user needs admin approval first
        return response
    },

    // Logout - invalidate refresh token
    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout')
        } finally {
            // Always clear tokens even if API call fails
            tokenStorage.clearTokens()
        }
    },

    // Refresh access token
    async refreshToken(): Promise<{ accessToken: string }> {
        const refreshToken = tokenStorage.getRefreshToken()

        if (!refreshToken) {
            throw new Error('No refresh token available')
        }

        const response = await apiClient.post<RefreshResponse>('/auth/refresh-token', {
            refreshToken,
        })

        // Store new tokens
        tokenStorage.setTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresAt: tokenStorage.calculateExpiresAt(response.expiresIn),
        })

        return { accessToken: response.accessToken }
    },

    // Get current user from token
    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<{ user: User }>('/users/me')
        return response.user
    },

    // Send OTP to phone
    async sendOtp(phone: string): Promise<void> {
        await apiClient.post('/auth/request-otp', { mobileNumber: phone })
    },

    // Verify OTP (same as login)
    async verifyOtp(_phone: string, _otp: string): Promise<{ verified: boolean }> {
        // This is handled by login now
        return { verified: true }
    },

    // Check if user is authenticated (has valid tokens)
    isAuthenticated(): boolean {
        return tokenStorage.hasRefreshToken()
    },

    // Check if access token needs refresh
    needsRefresh(): boolean {
        return tokenStorage.isAccessTokenExpired() && tokenStorage.hasRefreshToken()
    },
}
