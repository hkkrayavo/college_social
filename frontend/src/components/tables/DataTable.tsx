import React from 'react'
import { SortableHeader } from './SortableHeader'

/**
 * Column configuration for DataTable
 */
export interface Column<T> {
    /** Unique key for the column */
    key: string

    /** Header label */
    header: string

    /** Whether column is sortable (default: false) */
    sortable?: boolean

    /** Custom render function for cell content */
    render?: (item: T, index: number) => React.ReactNode

    /** Column width (e.g., 'w-32', '150px') */
    width?: string

    /** Additional cell class */
    className?: string
}

interface DataTableProps<T> {
    /** Column definitions */
    columns: Column<T>[]

    /** Data to display */
    data: T[]

    /** Loading state */
    loading?: boolean

    /** Key extractor for row keys (default: 'id') */
    keyExtractor?: (item: T) => string

    // Selection props
    /** Enable row selection */
    selectable?: boolean

    /** Set of selected item IDs */
    selectedIds?: Set<string>

    /** Handler when row selection is toggled */
    onToggleSelect?: (id: string) => void

    /** Handler when select all is toggled */
    onSelectAll?: () => void

    /** Whether all rows are selected */
    isAllSelected?: boolean

    // Sorting props
    /** Currently sorted field */
    sortField?: string

    /** Current sort direction */
    sortDirection?: 'asc' | 'desc'

    /** Handler when sort is changed */
    onSort?: (field: string) => void

    // Row actions
    /** Render function for row action buttons */
    rowActions?: (item: T) => React.ReactNode

    // States
    /** Message to show when no data */
    emptyMessage?: string

    /** Error message */
    error?: string | null

    /** Additional table class */
    className?: string
}

/**
 * Reusable data table component with sorting, selection, and loading states.
 * 
 * @example
 * ```tsx
 * const columns: Column<User>[] = [
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'email', header: 'Email', sortable: true },
 *     { key: 'role', header: 'Role', render: (u) => <Badge>{u.role}</Badge> }
 * ]
 * 
 * <DataTable
 *     columns={columns}
 *     data={users}
 *     loading={loading}
 *     selectable
 *     selectedIds={table.selectedIds}
 *     onToggleSelect={table.toggleSelect}
 *     sortField={table.sortField}
 *     sortDirection={table.sortDirection}
 *     onSort={table.handleSort}
 *     rowActions={(user) => (
 *         <Button onClick={() => handleEdit(user)}>Edit</Button>
 *     )}
 * />
 * ```
 */
export function DataTable<T extends object>({
    columns,
    data,
    loading = false,
    keyExtractor = (item) => String((item as Record<string, unknown>).id || ''),
    selectable = false,
    selectedIds = new Set(),
    onToggleSelect,
    onSelectAll,
    isAllSelected = false,
    sortField,
    sortDirection = 'asc',
    onSort,
    rowActions,
    emptyMessage = 'No data found',
    error,
    className = ''
}: DataTableProps<T>) {
    // Error state
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600">{error}</p>
            </div>
        )
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {/* Selection checkbox column */}
                            {selectable && (
                                <th className="w-12 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected && data.length > 0}
                                        onChange={onSelectAll}
                                        className="rounded border-gray-300 text-navy focus:ring-navy"
                                    />
                                </th>
                            )}

                            {/* Data columns */}
                            {columns.map((column) => (
                                column.sortable && onSort ? (
                                    <SortableHeader
                                        key={column.key}
                                        label={column.header}
                                        field={column.key}
                                        currentField={sortField || ''}
                                        direction={sortDirection}
                                        onSort={onSort}
                                        className={column.width}
                                    />
                                ) : (
                                    <th
                                        key={column.key}
                                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width || ''}`}
                                    >
                                        {column.header}
                                    </th>
                                )
                            ))}

                            {/* Actions column */}
                            {rowActions && (
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            // Loading state
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                                    className="px-4 py-12 text-center"
                                >
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                                        <span className="text-gray-500">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            // Empty state
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                                    className="px-4 py-12 text-center text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            // Data rows
                            data.map((item, index) => {
                                const id = keyExtractor(item)
                                const isSelected = selectedIds.has(id)

                                return (
                                    <tr
                                        key={id}
                                        className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-navy/5' : ''}`}
                                    >
                                        {/* Selection checkbox */}
                                        {selectable && (
                                            <td className="w-12 px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => onToggleSelect?.(id)}
                                                    className="rounded border-gray-300 text-navy focus:ring-navy"
                                                />
                                            </td>
                                        )}

                                        {/* Data cells */}
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={`px-4 py-3 text-sm ${column.className || ''}`}
                                            >
                                                {column.render
                                                    ? column.render(item, index)
                                                    : String(item[column.key as keyof T] ?? '')}
                                            </td>
                                        ))}

                                        {/* Actions cell */}
                                        {rowActions && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {rowActions(item)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DataTable
