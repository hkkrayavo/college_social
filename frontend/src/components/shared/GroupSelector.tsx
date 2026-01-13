import { useState, useEffect } from 'react'
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
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

    // Load initial recommendations or empty
    useEffect(() => {
        loadGroups('')
    }, [availableGroups]) // Reload if availableGroups changes

    const loadGroups = async (query: string) => {
        try {
            setLoading(true)
            if (availableGroups) {
                // Client-side filtering
                const filtered = availableGroups.filter(g =>
                    g.name.toLowerCase().includes(query.toLowerCase())
                )
                setSearchResults(filtered)
            } else {
                // Server-side filtering (Admin)
                const res = await adminService.getAllGroups(1, 20, query)
                setSearchResults(res.data)
            }
        } catch (err) {
            console.error('Failed to load groups:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (query: string) => {
        setSearchTerm(query)
        if (searchTimeout) clearTimeout(searchTimeout)

        const timeout = setTimeout(() => {
            loadGroups(query)
        }, 300)
        setSearchTimeout(timeout)
    }

    const addGroup = (group: GroupItem) => {
        if (!selectedGroups.some(g => g.id === group.id)) {
            onChange([...selectedGroups, { id: group.id, name: group.name }])
        }
    }

    const removeGroup = (groupId: string) => {
        onChange(selectedGroups.filter(g => g.id !== groupId))
    }

    const selectAllVisible = () => {
        const newGroups = searchResults.filter(g => !selectedGroups.some(sg => sg.id === g.id))
        const newSelected = newGroups.map(g => ({ id: g.id, name: g.name }))
        onChange([...selectedGroups, ...newSelected])
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
                        onClick={selectAllVisible}
                        disabled={visibleGroups.length === 0}
                        className="text-xs text-navy hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add All Visible
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
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Available Groups List */}
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {visibleGroups.length === 0 ? (
                    <p className="text-sm text-gray-400 p-4 text-center">
                        {searchTerm ? 'No matching groups found' : 'All groups selected or no groups available'}
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {visibleGroups.map(group => (
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
                        ))}
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
