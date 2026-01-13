import { useState } from 'react'
import { getMediaUrl } from '../../utils/helpers'

interface AvatarProps {
    src?: string | null
    name: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    className?: string
    fallbackClassName?: string
    onClick?: () => void
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
}

export function Avatar({ src, name, size = 'md', className = '', fallbackClassName = '', onClick }: AvatarProps) {
    const [imgError, setImgError] = useState(false)
    const baseClasses = `rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer ${sizeClasses[size]} ${className}`
    const initials = name ? name.charAt(0).toUpperCase() : '?'
    const fallbackStyle = fallbackClassName || 'bg-navy/10 text-navy'

    if (src && !imgError) {
        return (
            <div className={`${baseClasses} bg-gray-200`} onClick={onClick}>
                <img
                    src={getMediaUrl(src)}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        )
    }

    return (
        <div className={`${baseClasses} ${fallbackStyle} font-bold`} onClick={onClick}>
            {initials}
        </div>
    )
}
