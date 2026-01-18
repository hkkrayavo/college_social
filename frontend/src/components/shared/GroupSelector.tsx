import { useState, useEffect, useRef, useCallback } from 'react'
import { adminService, type GroupItem } from '../../services/adminService'

interface GroupSelectorProps {
    selectedGroups: { id: string; name: string }[]
    onChange: (groups: { id: string; name: string }[]) => void
    error?: string
    availableGroups?: GroupItem[] // If provided, uses client-side filtering instead of API
}

export function GroupSelector({ selectedGroups, onChange, availableGroups }: GroupSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<GroupItem[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const observer = useRef<IntersectionObserver | null>(null)
    const [addingAll, setAddingAll] = useState(false)

    const lastGroupElementRef = useCallback((node: HTMLButtonElement | null) => {
        if (loading) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !availableGroups) {
                setPage(prevPage => prevPage + 1)
            }
        })
        if (node) observer.current.observe(node)
    }, [loading, hasMore, availableGroups])

    // Load groups when page or search term changes
    useEffect(() => {
        if (availableGroups) {
            // Client-side filtering
            const filtered = availableGroups.filter(g =>
                g.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setSearchResults(filtered)
            setHasMore(false)
        } else {
            // Server-side fetching
            let isMounted = true
            const fetchGroups = async () => {
                setLoading(true)
                try {
                    const res = await adminService.getAllGroups(page, 20, searchTerm)
                    if (isMounted) {
                        setSearchResults(prev => page === 1 ? res.data : [...prev, ...res.data])
                        setHasMore(page < (res.pagination?.totalPages || 1))
                    }
                } catch (err) {
                    console.error('Failed to load groups:', err)
                } finally {
                    if (isMounted) setLoading(false)
                }
            }
            fetchGroups()
            return () => { isMounted = false }
        }
    }, [page, searchTerm, availableGroups])

    const handleSearch = (query: string) => {
        setSearchTerm(query)
        setPage(1)
        setSearchResults([])
    }

    const addGroup = (group: GroupItem) => {
        if (!selectedGroups.some(g => g.id === group.id)) {
            onChange([...selectedGroups, { id: group.id, name: group.name }])
        }
    }

    const removeGroup = (groupId: string) => {
        onChange(selectedGroups.filter(g => g.id !== groupId))
    }

    const selectAllBackend = async () => {
        if (availableGroups) {
            // Client side select all visible
            const newGroups = searchResults.filter(g => !selectedGroups.some(sg => sg.id === g.id))
            const newSelected = newGroups.map(g => ({ id: g.id, name: g.name }))
            onChange([...selectedGroups, ...newSelected])
        } else {
            // Fetch ALL groups from backend
            setAddingAll(true)
            try {
                // Fetch with a large limit to retrieve all eligible groups matching the search
                const res = await adminService.getAllGroups(1, 10000, searchTerm)
                const allGroups = res.data

                const currentIds = new Set(selectedGroups.map(g => g.id))
                const newGroups = allGroups.filter(g => !currentIds.has(g.id))
                const newSelected = newGroups.map(g => ({ id: g.id, name: g.name }))

                onChange([...selectedGroups, ...newSelected])
            } catch (err) {
                console.error("Failed to add all groups:", err)
            } finally {
                setAddingAll(false)
            }
        }
    }

    const clearAll = () => {
        onChange([])
    }

    // Filter out already selected groups from the display list
    const visibleGroups = searchResults.filter(g => !selectedGroups.some(sg => sg.id === g.id))

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                    Share with Groups
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={selectAllBackend}
                        disabled={loading || addingAll}
                        className="text-xs text-navy hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        {addingAll ? 'Adding...' : 'Add All'}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        type="button"
                        onClick={clearAll}
                        disabled={selectedGroups.length === 0}
                        className="text-xs text-gray-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            {/* Selected Groups Chips */}
            {selectedGroups.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    {selectedGroups.map(group => (
                        <span
                            key={group.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-full"
                        >
                            {group.name}
                            <button
                                type="button"
                                onClick={() => removeGroup(group.id)}
                                className="hover:bg-green-700 rounded-full p-0.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative mb-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search groups..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault() // Prevent form submission
                    }}
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {(loading || addingAll) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Available Groups List */}
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto custom-scrollbar">
                {visibleGroups.length === 0 && !loading ? (
                    <p className="text-sm text-gray-400 p-4 text-center">
                        {searchTerm ? 'No matching groups found' : 'All available groups selected'}
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {visibleGroups.map((group, index) => {
                            if (visibleGroups.length === index + 1) {
                                return (
                                    <button
                                        ref={lastGroupElementRef}
                                        key={group.id}
                                        type="button"
                                        onClick={() => addGroup(group)}
                                        className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded mr-3 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="text-gray-800 font-medium">{group.name}</span>
                                            {group.type && (
                                                <span className="ml-2 text-xs text-gray-400">({group.type})</span>
                                            )}
                                        </div>
                                    </button>
                                )
                            } else {
                                return (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => addGroup(group)}
                                        className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded mr-3 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="text-gray-800 font-medium">{group.name}</span>
                                            {group.type && (
                                                <span className="ml-2 text-xs text-gray-400">({group.type})</span>
                                            )}
                                        </div>
                                    </button>
                                )
                            }
                        })}
                        {loading && (
                            <div className="p-3 text-center">
                                <div className="animate-spin w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full mx-auto"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <p className="text-sm text-gray-500 mt-2">
                {selectedGroups.length === 0 ? (
                    <span className="text-amber-600">⚠ No groups selected</span>
                ) : (
                    <span className="text-green-600">✓ {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected</span>
                )}
            </p>
        </div>
    )
}
