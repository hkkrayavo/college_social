import { type ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-2xl font-bold text-navy">{title}</h2>
                {subtitle && (
                    <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    )
}
