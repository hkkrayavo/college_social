import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole, Permission } from '../../types/auth.types'

interface RoleGuardProps {
    children: ReactNode
    roles?: UserRole | UserRole[]
    permission?: Permission
    fallback?: ReactNode
}

// Inline component to conditionally render based on role or permission
export function RoleGuard({ children, roles, permission, fallback = null }: RoleGuardProps) {
    const { hasRole, hasPermission } = useAuth()

    // Check role if provided
    if (roles && !hasRole(roles)) {
        return <>{fallback}</>
    }

    // Check permission if provided
    if (permission && !hasPermission(permission)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

export default RoleGuard
