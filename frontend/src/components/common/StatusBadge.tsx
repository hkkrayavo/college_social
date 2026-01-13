import type { ReactNode } from 'react'

export type StatusType = 'approved' | 'pending' | 'rejected' | 'active' | 'inactive' | string

interface StatusBadgeProps {
    status: StatusType
    size?: 'sm' | 'md' | 'lg'
    className?: string
    children?: ReactNode
}

const statusStyles: Record<string, { bg: string; text: string }> = {
    approved: { bg: 'bg-green-100', text: 'text-green-700' },
    active: { bg: 'bg-green-100', text: 'text-green-700' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-500' },
}

const defaultStyle = { bg: 'bg-gray-100', text: 'text-gray-700' }

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
}

/**
 * StatusBadge - Reusable status indicator component
 * 
 * @param status - The status value (approved, pending, rejected, active, inactive)
 * @param size - Badge size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param className - Additional CSS classes
 * @param children - Optional custom label (defaults to capitalized status)
 */
export function StatusBadge({
    status,
    size = 'md',
    className = '',
    children
}: StatusBadgeProps) {
    const style = statusStyles[status.toLowerCase()] || defaultStyle
    const sizeClass = sizeClasses[size]

    return (
        <span
            className={`
                inline-flex items-center justify-center
                rounded-full font-medium capitalize
                ${style.bg} ${style.text}
                ${sizeClass}
                ${className}
            `.trim().replace(/\s+/g, ' ')}
        >
            {children || status}
        </span>
    )
}

/**
 * Helper function for cases where you only need the classes
 * (backward compatible with existing getStatusBadge usage)
 */
export function getStatusBadgeClasses(status: string): string {
    const style = statusStyles[status.toLowerCase()] || defaultStyle
    return `${style.bg} ${style.text}`
}

export default StatusBadge
