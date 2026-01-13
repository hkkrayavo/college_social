import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'gold' | 'danger' | 'ghost' | 'success' | 'purple'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    leftIcon?: ReactNode
    rightIcon?: ReactNode
    fullWidth?: boolean
    children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-navy text-white hover:bg-navy-dark',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'bg-transparent text-navy border-2 border-navy hover:bg-navy hover:text-white',
    gold: 'bg-gold text-navy hover:bg-gold-dark',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent text-navy hover:bg-gray-100',
    success: 'bg-green-500 text-white hover:bg-green-600',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
}

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
}

const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
)

/**
 * Button - Reusable button component with variants, sizes, and loading state
 * 
 * @param variant - Button style variant: 'primary' | 'secondary' | 'outline' | 'gold' | 'danger' | 'ghost'
 * @param size - Button size: 'sm' | 'md' | 'lg'
 * @param loading - Show loading spinner and disable button
 * @param leftIcon - Icon to display on the left
 * @param rightIcon - Icon to display on the right
 * @param fullWidth - Make button full width
 * @param disabled - Disable the button
 */
export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className = '',
    children,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading

    return (
        <button
            className={`
                inline-flex items-center justify-center gap-2
                rounded-lg font-semibold cursor-pointer
                transition-all duration-200
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${fullWidth ? 'w-full' : ''}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-[0.98]'}
                ${className}
            `.trim().replace(/\s+/g, ' ')}
            disabled={isDisabled}
            {...props}
        >
            {loading ? <LoadingSpinner /> : leftIcon}
            {children}
            {!loading && rightIcon}
        </button>
    )
}

export default Button
