

interface SortableHeaderProps {
    /** Column label to display */
    label: string

    /** Field name for sorting */
    field: string

    /** Currently sorted field */
    currentField: string

    /** Current sort direction */
    direction: 'asc' | 'desc'

    /** Handler when header is clicked */
    onSort: (field: string) => void

    /** Additional CSS classes */
    className?: string
}

/**
 * Reusable sortable table header component.
 * Shows sort direction indicator when this column is active.
 */
export function SortableHeader({
    label,
    field,
    currentField,
    direction,
    onSort,
    className = ''
}: SortableHeaderProps) {
    const isActive = currentField === field

    return (
        <th
            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${className}`}
            onClick={() => onSort(field)}
        >
            <div className="flex items-center gap-1">
                <span>{label}</span>
                <SortIcon isActive={isActive} direction={direction} />
            </div>
        </th>
    )
}

// Sort icon component
function SortIcon({ isActive, direction }: { isActive: boolean; direction: 'asc' | 'desc' }) {
    if (!isActive) {
        // Neutral state - show both arrows dimmed
        return (
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        )
    }

    if (direction === 'asc') {
        return (
            <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        )
    }

    return (
        <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    )
}

export default SortableHeader
