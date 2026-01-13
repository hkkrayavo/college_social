import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types/auth.types'

interface ProtectedRouteProps {
    requiredRoles?: UserRole | UserRole[]
    redirectTo?: string
    unauthorizedRedirect?: string
}

// Loading spinner component
function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
        </div>
    )
}

export function ProtectedRoute({
    requiredRoles,
    redirectTo = '/login',
    unauthorizedRedirect = '/unauthorized',
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, hasRole } = useAuth()
    const location = useLocation()

    // Show loading while checking auth
    if (isLoading) {
        return <LoadingSpinner />
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />
    }

    // Check role if required
    if (requiredRoles && !hasRole(requiredRoles)) {
        return <Navigate to={unauthorizedRedirect} replace />
    }

    // Authenticated and authorized - render children
    return <Outlet />
}

export default ProtectedRoute
