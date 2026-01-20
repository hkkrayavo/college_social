import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService, type GroupItem } from '../../services/adminService'
import { Button } from '../../components/common/Button'

export function AlbumForm() {
    const { eventId, albumId } = useParams<{ eventId?: string; albumId?: string }>()
    const navigate = useNavigate()
    const isEditing = !!albumId

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [eventInfo, setEventInfo] = useState<{ id: string; name: string; date: string } | null>(null)

    // Groups state
    const [groups, setGroups] = useState<GroupItem[]>([])
    const [groupSearch, setGroupSearch] = useState('')
    const [groupsLoading, setGroupsLoading] = useState(false)
    const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        groupIds: [] as string[],
    })

    // Selected groups with names for display
    const [selectedGroups, setSelectedGroups] = useState<{ id: string; name: string }[]>([])

    // Load data
    useEffect(() => {
        loadInitialData()
    }, [eventId, albumId])

    const loadInitialData = async () => {
        try {
            setLoading(true)

            // Load initial groups
            const groupsRes = await adminService.getAllGroups(1, 20)
            setGroups(groupsRes.data || [])

            if (isEditing && albumId) {
                // Editing: load album data
                const album = await adminService.getAlbum(albumId)
                const albumGroups = album.groups || []
                setFormData({
                    name: album.name,
                    description: album.description || '',
                    groupIds: albumGroups.map(g => g.id),
                })
                setSelectedGroups(albumGroups)
                if (album.event) {
                    setEventInfo(album.event)
                }
            } else if (eventId) {
                // Creating: load event info and inherit groups from event
                const event = await adminService.getEvent(eventId)
                setEventInfo({ id: event.id, name: event.name, date: event.date })

                // Pre-populate with event's groups
                const eventGroups = event.groups || []
                if (eventGroups.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        groupIds: eventGroups.map(g => g.id)
                    }))
                    setSelectedGroups(eventGroups.map(g => ({ id: g.id, name: g.name })))
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    // Debounced group search
    const handleGroupSearch = (query: string) => {
        setGroupSearch(query)

        if (searchTimeout) {
            clearTimeout(searchTimeout)
        }

        const timeout = setTimeout(async () => {
            setGroupsLoading(true)
            try {
                const res = await adminService.getAllGroups(1, 30, query)
                setGroups(res.data || [])
            } catch (err) {
                console.error('Failed to search groups:', err)
            } finally {
                setGroupsLoading(false)
            }
        }, 300)

        setSearchTimeout(timeout)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const data = {
                name: formData.name,
                description: formData.description || undefined,
                groupIds: formData.groupIds.length > 0 ? formData.groupIds : undefined,
            }

            if (isEditing && albumId) {
                await adminService.updateAlbum(albumId, data)
                navigate(-1) // Go back to previous page
            } else if (eventId) {
                await adminService.createAlbum(eventId, data)
                navigate(`/dashboard/admin/events/${eventId}/albums`)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save album')
        } finally {
            setSubmitting(false)
        }
    }

    const addGroup = (group: GroupItem) => {
        if (!formData.groupIds.includes(group.id)) {
            setFormData(prev => ({ ...prev, groupIds: [...prev.groupIds, group.id] }))
            setSelectedGroups(prev => [...prev, { id: group.id, name: group.name }])
        }
    }

    const removeGroup = (groupId: string) => {
        setFormData(prev => ({ ...prev, groupIds: prev.groupIds.filter(id => id !== groupId) }))
        setSelectedGroups(prev => prev.filter(g => g.id !== groupId))
    }

    const selectAllVisible = () => {
        const newGroups = groups.filter(g => !formData.groupIds.includes(g.id))
        setFormData(prev => ({ ...prev, groupIds: [...prev.groupIds, ...newGroups.map(g => g.id)] }))
        setSelectedGroups(prev => [...prev, ...newGroups.map(g => ({ id: g.id, name: g.name }))])
    }

    const clearAllGroups = () => {
        setFormData(prev => ({ ...prev, groupIds: [] }))
        setSelectedGroups([])
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        )
    }

    const backUrl = eventInfo
        ? `/dashboard/admin/events/${eventInfo.id}/albums`
        : '/dashboard/admin/events'

    // Filter out already selected groups from the list
    const availableGroups = groups.filter(g => !formData.groupIds.includes(g.id))

    return (
        <div className="w-[90%] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <Button
                        onClick={() => navigate(backUrl)}
                        variant="ghost"
                        className="text-gray-500 hover:text-navy"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-navy">
                            {isEditing ? 'Edit Album' : 'Create Album'}
                        </h1>
                        {eventInfo && (
                            <p className="text-gray-500 text-sm">
                                Event: {eventInfo.name}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Album Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Album Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                            placeholder="e.g., CS Performances, Day 1 Photos"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Add a description for this album..."
                        />
                    </div>

                    {/* Group Selection with Search */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Share with Groups
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllVisible}
                                    className="text-xs text-navy hover:underline"
                                >
                                    Add All Visible
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    type="button"
                                    onClick={clearAllGroups}
                                    className="text-xs text-gray-500 hover:underline"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Info about inherited groups */}
                        {!isEditing && eventInfo && (
                            <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded-lg mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Groups inherited from event "{eventInfo.name}". You can add or remove groups below.
                            </p>
                        )}

                        {/* Selected Groups as Chips */}
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
                                value={groupSearch}
                                onChange={(e) => handleGroupSearch(e.target.value)}
                                placeholder="Search groups..."
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                            />
                            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {groupsLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full"></div>
                                </div>
                            )}
                        </div>

                        {/* Available Groups List */}
                        <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                            {availableGroups.length === 0 ? (
                                <p className="text-sm text-gray-400 p-4 text-center">
                                    {groupSearch ? 'No matching groups found' : 'All groups selected or no groups available'}
                                </p>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {availableGroups.map(group => (
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
                                <span className="text-amber-600">⚠ No groups selected - album won't be visible to anyone</span>
                            ) : (
                                <span className="text-green-600">✓ {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} can view this album</span>
                            )}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => navigate(backUrl)}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            loading={submitting}
                            variant="primary"
                            className="flex-1"
                        >
                            {submitting ? 'Saving...' : (isEditing ? 'Update Album' : 'Create Album')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AlbumForm
