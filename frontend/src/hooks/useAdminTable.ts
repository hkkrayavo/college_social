import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Configuration options for the useAdminTable hook
 */
export interface UseAdminTableOptions<T> {
    /**
     * Function to fetch data from the API
     * @param page - Current page number (1-indexed)
     * @param limit - Number of items per page
     * @param search - Optional search query
     * @returns Promise with data array and optional pagination info
     */
    fetchData: (page: number, limit: number, search?: string) => Promise<{
        data: T[]
        pagination?: { total: number; totalPages: number }
    }>

    /** Default sort configuration */
    defaultSort?: { field: string; direction: 'asc' | 'desc' }

    /** Default items per page (default: 10) */
    defaultItemsPerPage?: number

    /** Key to use for item ID (default: 'id') */
    idKey?: keyof T
}

/**
 * Return type for useAdminTable hook
 */
export interface UseAdminTableReturn<T> {
    // Data state
    items: T[]
    loading: boolean
    error: string | null

    // Pagination
    page: number
    setPage: (page: number) => void
    totalPages: number
    totalItems: number
    itemsPerPage: number
    setItemsPerPage: (n: number) => void

    // Search
    search: string
    setSearch: (s: string) => void

    // Sorting
    sortField: string
    sortDirection: 'asc' | 'desc'
    handleSort: (field: string) => void
    getSortedItems: () => T[]

    // Selection
    selectedIds: Set<string>
    toggleSelect: (id: string) => void
    selectAll: () => void
    clearSelection: () => void
    isAllSelected: boolean
    isSelected: (id: string) => boolean
    selectedCount: number

    // Actions
    refresh: () => void
}

/**
 * Custom hook for managing admin table state including pagination,
 * sorting, selection, and data fetching.
 * 
 * @example
 * ```tsx
 * const table = useAdminTable({
 *     fetchData: (page, limit, search) => adminService.getUsers(page, limit, undefined, search),
 *     defaultSort: { field: 'createdAt', direction: 'desc' }
 * })
 * 
 * return (
 *     <DataTable
 *         data={table.getSortedItems()}
 *         loading={table.loading}
 *         selectedIds={table.selectedIds}
 *         onSort={table.handleSort}
 *         // ... etc
 *     />
 * )
 * ```
 */
export function useAdminTable<T extends object>(
    options: UseAdminTableOptions<T>
): UseAdminTableReturn<T> {
    const {
        fetchData,
        defaultSort = { field: 'createdAt', direction: 'desc' as const },
        defaultItemsPerPage = 10,
        idKey = 'id' as keyof T
    } = options

    // Store fetchData in a ref to avoid dependency issues
    const fetchDataRef = useRef(fetchData)
    fetchDataRef.current = fetchData

    // Data state
    const [items, setItems] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Pagination state
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

    // Search state
    const [search, setSearch] = useState('')

    // Sorting state
    const [sortField, setSortField] = useState(defaultSort.field)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSort.direction)

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Fetch data function - use ref to avoid recreating on every render
    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetchDataRef.current(page, itemsPerPage, search || undefined)
            setItems(response.data)
            setTotalPages(response.pagination?.totalPages || 1)
            setTotalItems(response.pagination?.total || response.data.length)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
            setItems([])
        } finally {
            setLoading(false)
        }
    }, [page, itemsPerPage, search]) // Removed fetchData from deps - using ref instead

    // Load data on mount and when dependencies change
    useEffect(() => {
        loadData()
    }, [loadData])

    // Reset page when items per page changes
    const handleSetItemsPerPage = useCallback((perPage: number) => {
        setItemsPerPage(perPage)
        setPage(1)
    }, [])

    // Reset page when search changes
    const handleSetSearch = useCallback((newSearch: string) => {
        setSearch(newSearch)
        setPage(1)
    }, [])

    // Sorting handler
    const handleSort = useCallback((field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }, [sortField])

    // Get sorted items (client-side sorting)
    const getSortedItems = useCallback(() => {
        return [...items].sort((a, b) => {
            const aValue = a[sortField as keyof T]
            const bValue = b[sortField as keyof T]

            // Handle null/undefined
            if (aValue == null && bValue == null) return 0
            if (aValue == null) return 1
            if (bValue == null) return -1

            // Compare values
            let comparison = 0
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue)
            } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue
            } else {
                comparison = String(aValue).localeCompare(String(bValue))
            }

            return sortDirection === 'asc' ? comparison : -comparison
        })
    }, [items, sortField, sortDirection])

    // Selection handlers
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    const selectAll = useCallback(() => {
        if (selectedIds.size === items.length) {
            // All selected, clear selection
            setSelectedIds(new Set())
        } else {
            // Select all
            const allIds = items.map(item => String(item[idKey]))
            setSelectedIds(new Set(allIds))
        }
    }, [items, idKey, selectedIds.size])

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set())
    }, [])

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id)
    }, [selectedIds])

    const isAllSelected = items.length > 0 && selectedIds.size === items.length

    // Refresh function
    const refresh = useCallback(() => {
        setSelectedIds(new Set())
        loadData()
    }, [loadData])

    return {
        // Data
        items,
        loading,
        error,

        // Pagination
        page,
        setPage,
        totalPages,
        totalItems,
        itemsPerPage,
        setItemsPerPage: handleSetItemsPerPage,

        // Search
        search,
        setSearch: handleSetSearch,

        // Sorting
        sortField,
        sortDirection,
        handleSort,
        getSortedItems,

        // Selection
        selectedIds,
        toggleSelect,
        selectAll,
        clearSelection,
        isAllSelected,
        isSelected,
        selectedCount: selectedIds.size,

        // Actions
        refresh
    }
}
