import { type ReactNode } from 'react'
import { cn } from '../../utils'

interface CardProps {
    children: ReactNode
    className?: string
    hover?: boolean
}

export function Card({ children, className, hover = true }: CardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100',
                hover && 'hover:shadow-md transition-shadow',
                className
            )}
        >
            {children}
        </div>
    )
}

interface CardImageProps {
    src: string
    alt: string
    className?: string
}

export function CardImage({ src, alt, className }: CardImageProps) {
    return (
        <div className={cn('overflow-hidden', className)}>
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
        </div>
    )
}

interface CardContentProps {
    children: ReactNode
    className?: string
}

export function CardContent({ children, className }: CardContentProps) {
    return <div className={cn('p-4', className)}>{children}</div>
}

interface CardTitleProps {
    children: ReactNode
    className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
    return <h3 className={cn('font-semibold text-gray-800', className)}>{children}</h3>
}

interface CardDescriptionProps {
    children: ReactNode
    className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return <p className={cn('text-gray-400 text-sm', className)}>{children}</p>
}
