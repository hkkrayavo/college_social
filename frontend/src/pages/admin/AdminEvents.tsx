import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService, type EventItem } from '../../services/adminService'
import { SearchFilter, Button, Pagination } from '../../components/common'

type SortField = 'name' | 'date' | 'albumCount'
type SortDirection = 'asc' | 'desc'
type ViewMode = 'grid' | 'table'

export function AdminEvents() {
    const navigate = useNavigate()
    const [events, setEvents] = useState<EventItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState<ViewMode>('table')

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('date')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Expanded row state (for table view)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Pagination state
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true)
            const response = await adminService.getAllEvents(page, itemsPerPage)
            setEvents(response.data || [])
            setTotalPages(response.pagination?.totalPages || 1)
            setTotalItems(response.pagination?.total || 0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load events')
        } finally {
            setLoading(false)
        }
    }, [page, itemsPerPage])

    useEffect(() => {
        loadEvents()
    }, [loadEvents])

    useEffect(() => {
        setSelectedIds(new Set())
    }, [events])

    const handleItemsPerPageChange = (perPage: number) => {
        setItemsPerPage(perPage)
        setPage(1)
    }

    const handleDelete = async (eventId: string) => {
        if (!confirm('Delete this event and ALL its albums? This cannot be undone.')) return

        try {
            await adminService.deleteEvent(eventId)
            loadEvents()
        } catch (err) {
            console.error('Failed to delete event:', err)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const formatTime = (time: string | null) => {
        if (!time) return ''
        const [hours, minutes] = time.split(':')
        const h = parseInt(hours)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h % 12 || 12
        return `${h12}:${minutes} ${ampm}`
    }

    // Sorting handler
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Sort icon component
    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return (
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            )
        }
        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        )
    }

    // Selection handlers
    const handleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedEvents.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAndSortedEvents.map(e => e.id)))
        }
    }

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    // Filter and sort events
    const filteredAndSortedEvents = events
        .filter(event =>
            event.name.toLowerCase().includes(search.toLowerCase()) ||
            (event.description && event.description.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            let comparison = 0
            if (sortField === 'date') {
                comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
            } else if (sortField === 'albumCount') {
                comparison = a.albumCount - b.albumCount
            } else {
                comparison = a.name.localeCompare(b.name)
            }
            return sortDirection === 'asc' ? comparison : -comparison
        })

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-600',
            'bg-indigo-600',
            'bg-purple-600',
            'bg-pink-600',
            'bg-rose-600',
            'bg-amber-600',
            'bg-emerald-600',
            'bg-cyan-600',
            'bg-teal-600'
        ]
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
        return colors[index]
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy">Events</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage events and their photo albums</p>
                </div>
                <div className="flex items-center gap-3">
                    <SearchFilter
                        value={search}
                        onChange={setSearch}
                        placeholder="Search events..."
                    />
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'} transition-colors`}
                            title="Grid view"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'} transition-colors`}
                            title="Table view"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    <Button
                        onClick={() => navigate('/dashboard/admin/events/new')}
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        }
                    >
                        Create Event
                    </Button>
                </div>
            </div>

            {/* Selection Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-navy/5 border border-navy/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-navy font-medium">
                        {selectedIds.size} event{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear
                        </Button>
                        <Button variant="danger" size="sm">
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                    {error}
                    <button onClick={loadEvents} className="ml-4 underline">Retry</button>
                </div>
            )}

            {/* Events Content */}
            {loading ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                                <div className="h-10 bg-gray-200 rounded w-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                <tr>
                                    <th className="w-12 px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></th>
                                    <th className="text-left px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></th>
                                    <th className="text-left px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12" /></th>
                                    <th className="text-left px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></th>
                                    <th className="text-left px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-gray-100">
                                        <td className="px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-12" /></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-24" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : filteredAndSortedEvents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">{search ? 'No events match your search' : 'No events yet'}</p>
                    <button
                        onClick={() => navigate('/dashboard/admin/events/new')}
                        className="btn-primary"
                    >
                        Create Your First Event
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedEvents.map(event => (
                        <div
                            key={event.id}
                            className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-200 ${selectedIds.has(event.id) ? 'border-navy ring-2 ring-navy/20' : 'border-gray-100'
                                }`}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(event.id)}
                                            onChange={() => handleSelectRow(event.id)}
                                            className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                        />
                                        <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">{event.name}</h3>
                                    </div>
                                    <span className="bg-gradient-to-r from-navy/10 to-navy/20 text-navy text-xs px-2.5 py-1 rounded-full whitespace-nowrap ml-2 font-medium">
                                        {event.albumCount} album{event.albumCount !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-500 space-y-1 mb-4">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>
                                            {formatDate(event.date)}
                                            {event.endDate && event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}
                                        </span>
                                    </div>
                                    {(event.startTime || event.endTime) && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>
                                                {formatTime(event.startTime)}
                                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {event.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/dashboard/admin/events/${event.id}/albums`)}
                                        className="flex-1 btn-primary text-sm py-2"
                                    >
                                        View Albums
                                    </button>
                                    <button
                                        onClick={() => navigate(`/dashboard/admin/events/${event.id}/edit`)}
                                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Table View */
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                <tr>
                                    <th className="w-12 px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={filteredAndSortedEvents.length > 0 && selectedIds.size === filteredAndSortedEvents.length}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                        />
                                    </th>
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Event Name
                                            <SortIcon field="name" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('date')}
                                        className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Date
                                            <SortIcon field="date" />
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('albumCount')}
                                        className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            Albums
                                            <SortIcon field="albumCount" />
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAndSortedEvents.map((event, index) => (
                                    <>
                                        <tr
                                            key={event.id}
                                            className={`
                                            transition-all duration-150 cursor-pointer
                                            ${selectedIds.has(event.id) ? 'bg-navy/5' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                            hover:bg-navy/10
                                        `}
                                            onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                                        >
                                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(event.id)}
                                                    onChange={() => handleSelectRow(event.id)}
                                                    className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4" style={{ maxWidth: '280px' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 ${getAvatarColor(event.name)} rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm flex-shrink-0`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0 flex-1 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-800 text-sm truncate">{event.name}</span>
                                                            <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expandedId === event.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                        {event.description && (
                                                            <p className="text-xs text-gray-500 truncate">{event.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {formatDate(event.date)}
                                                {event.endDate && event.endDate !== event.date && (
                                                    <span className="text-gray-400"> — {formatDate(event.endDate)}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 bg-navy/10 text-navy rounded-full text-xs font-medium">
                                                    {event.albumCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => navigate(`/dashboard/admin/events/${event.id}/albums`)}
                                                        className="p-2 text-gray-500 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors flex-shrink-0"
                                                        title="View albums"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/dashboard/admin/events/${event.id}/edit`)}
                                                        className="p-2 text-gray-500 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors flex-shrink-0"
                                                        title="Edit event"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(event.id)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                        title="Delete event"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded Details Row */}
                                        {expandedId === event.id && (
                                            <tr key={`${event.id}-details`} className="bg-gray-50 border-l-4 border-purple-500">
                                                <td className="px-4"></td>
                                                <td colSpan={4} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Event Information</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <p><span className="text-gray-500">Name:</span> <span className="font-medium">{event.name}</span></p>
                                                                <p><span className="text-gray-500">Date:</span> {formatDate(event.date)}{event.endDate && event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}</p>
                                                                {(event.startTime || event.endTime) && (
                                                                    <p><span className="text-gray-500">Time:</span> {formatTime(event.startTime)}{event.endTime && ` - ${formatTime(event.endTime)}`}</p>
                                                                )}
                                                                <p><span className="text-gray-500">Albums:</span> <span className="font-medium">{event.albumCount}</span></p>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-1">
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h4>
                                                            <p className="text-sm text-gray-700">{event.description || <span className="text-gray-400 italic">No description provided</span>}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button
                                                                    variant="purple"
                                                                    size="sm"
                                                                    onClick={() => navigate(`/dashboard/admin/events/${event.id}/albums`)}
                                                                >
                                                                    View Albums
                                                                </Button>
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => navigate(`/dashboard/admin/events/${event.id}/edit`)}
                                                                >
                                                                    Edit Event
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    className="border-red-300"
                                                                    onClick={() => handleDelete(event.id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!loading && events.length > 0 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
            )}
        </div>
    )
}

export default AdminEvents
