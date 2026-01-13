import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, UserRole, Permission, AuthError } from '../types/auth.types'
import { ROLE_PERMISSIONS } from '../types/auth.types'
import { authService } from '../services/authService'
import { tokenStorage } from '../utils/tokenStorage'

// Auth context type
interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: AuthError | null
    login: (phone: string, otp: string) => Promise<void>
    logout: () => Promise<void>
    setUser: (user: User | null) => void
    clearError: () => void
    hasRole: (role: UserRole | UserRole[]) => boolean
    hasPermission: (permission: Permission) => boolean
    refreshSession: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<AuthError | null>(null)

    // Initialize auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check if we have tokens
                if (!tokenStorage.hasRefreshToken()) {
                    setIsLoading(false)
                    return
                }

                // If access token expired, try refreshing
                if (tokenStorage.isAccessTokenExpired()) {
                    await authService.refreshToken()
                }

                // Get current user
                const currentUser = await authService.getCurrentUser()
                setUser(currentUser)
            } catch {
                // Clear tokens on any error
                tokenStorage.clearTokens()
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()
    }, [])

    // Login handler
    const login = useCallback(async (phone: string, otp: string) => {
        setError(null)
        setIsLoading(true)

        try {
            const { user: loggedInUser } = await authService.login({ phone, otp })
            setUser(loggedInUser)
        } catch (err) {
            const authError: AuthError = {
                code: 'LOGIN_FAILED',
                message: err instanceof Error ? err.message : 'Login failed. Please try again.',
            }
            setError(authError)
            throw authError
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Logout handler
    const logout = useCallback(async () => {
        setIsLoading(true)
        try {
            await authService.logout()
        } finally {
            setUser(null)
            setIsLoading(false)
        }
    }, [])

    // Clear error
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // Check if user has specific role(s)
    const hasRole = useCallback(
        (role: UserRole | UserRole[]): boolean => {
            if (!user) return false
            const roles = Array.isArray(role) ? role : [role]
            return roles.includes(user.role)
        },
        [user]
    )

    // Check if user has specific permission
    const hasPermission = useCallback(
        (permission: Permission): boolean => {
            if (!user) return false
            const userPermissions = ROLE_PERMISSIONS[user.role] || []
            return userPermissions.includes(permission) || userPermissions.includes('admin:all')
        },
        [user]
    )

    // Refresh session manually
    const refreshSession = useCallback(async () => {
        try {
            await authService.refreshToken()
            const currentUser = await authService.getCurrentUser()
            setUser(currentUser)
        } catch {
            tokenStorage.clearTokens()
            setUser(null)
            throw new Error('Session expired. Please login again.')
        }
    }, [])

    // Refresh user data (after profile update)
    const refreshUser = useCallback(async () => {
        try {
            const currentUser = await authService.getCurrentUser()
            setUser(currentUser)
        } catch (err) {
            console.error('Failed to refresh user:', err)
        }
    }, [])

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        setUser,
        clearError,
        hasRole,
        hasPermission,
        refreshSession,
        refreshUser,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuthContext() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider')
    }
    return context
}
