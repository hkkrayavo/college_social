// Common utility functions

/**
 * Format a date string to a readable format
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options,
    })
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), wait)
    }
}

/**
 * Classname helper - combines class strings
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ')
}

/**
 * Resolves the full URL for media files
 * prefixes backend URL if path is relative
 */
export function getMediaUrl(path: string | null | undefined): string {
    if (!path) return ''

    // Handle dev mode placeholder URLs - treat as no image
    if (path.includes('placeholder.local')) return ''

    if (path.startsWith('http') || path.startsWith('blob:')) return path

    // Get base URL from environment or default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const baseUrl = apiUrl.replace(/\/api\/?$/, '')

    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    return `${baseUrl}${cleanPath}`
}
