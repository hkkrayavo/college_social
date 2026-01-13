import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    isLoading?: boolean
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

    const variants = {
        primary: 'bg-gold text-navy hover:bg-gold/90 focus:ring-gold',
        secondary: 'bg-navy text-white hover:bg-navy/90 focus:ring-navy',
        outline: 'border-2 border-navy text-navy hover:bg-navy/5 focus:ring-navy',
        ghost: 'text-navy hover:bg-navy/5 focus:ring-navy',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    }

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2 animate-spin">⏳</span>
            ) : null}
            {children}
        </button>
    )
}
