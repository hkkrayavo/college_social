import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import type { UserRole } from '../types/auth.types'

// Re-export useAuthContext as useAuth for convenience
export function useAuth() {
    return useAuthContext()
}

// Hook that requires authentication and optionally a specific role
// Redirects to login if not authenticated, or unauthorized page if wrong role
export function useRequireAuth(requiredRoles?: UserRole | UserRole[]) {
    const { user, isAuthenticated, isLoading, hasRole } = useAuthContext()
    const navigate = useNavigate()

    useEffect(() => {
        if (isLoading) return

        if (!isAuthenticated) {
            // Not authenticated, redirect to login
            navigate('/login', { replace: true })
            return
        }

        if (requiredRoles && !hasRole(requiredRoles)) {
            // Authenticated but wrong role, redirect to unauthorized
            navigate('/unauthorized', { replace: true })
        }
    }, [isAuthenticated, isLoading, requiredRoles, hasRole, navigate])

    return {
        user,
        isAuthenticated,
        isLoading,
        isAuthorized: isAuthenticated && (!requiredRoles || hasRole(requiredRoles)),
    }
}
