import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Smart redirect component for /dashboard entry point
 * - Admins → /dashboard/admin
 * - Students/Users → /dashboard/feed
 */
export function DashboardRedirect() {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
        )
    }

    const isAdmin = user?.role === 'admin'

    if (isAdmin) {
        return <Navigate to="/dashboard/admin" replace />
    }

    return <Navigate to="/dashboard/user" replace />
}

export default DashboardRedirect
