import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService, type AlbumItem } from '../../services/adminService'
import { Button } from '../../components/common/Button'

export function EventAlbums() {
    const { eventId } = useParams<{ eventId: string }>()
    const navigate = useNavigate()

    const [eventInfo, setEventInfo] = useState<{ id: string; name: string; date: string } | null>(null)
    const [albums, setAlbums] = useState<AlbumItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        if (!eventId) return

        try {
            setLoading(true)
            const albumsRes = await adminService.getEventAlbums(eventId)
            setEventInfo(albumsRes.event)
            setAlbums(albumsRes.data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load albums')
        } finally {
            setLoading(false)
        }
    }, [eventId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleDelete = async (albumId: string) => {
        if (!confirm('Delete this album and all its photos/videos? This cannot be undone.')) return

        try {
            await adminService.deleteAlbum(albumId)
            loadData()
        } catch (err) {
            console.error('Failed to delete album:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading albums...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                {error}
                <Button onClick={loadData} variant="ghost" className="ml-4 underline text-red-700 hover:text-red-800 hover:bg-red-100 p-0 h-auto">Retry</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => navigate('/dashboard/admin/events')}
                        variant="ghost"
                        className="text-gray-500 hover:text-navy p-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-navy">{eventInfo?.name || 'Event Albums'}</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {eventInfo?.date && new Date(eventInfo.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => navigate(`/dashboard/admin/events/${eventId}/albums/new`)}
                    variant="primary"
                    className="flex items-center gap-2"
                    leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    }
                >
                    Create Album
                </Button>
            </div>

            {/* Albums Grid */}
            {albums.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No albums yet for this event</p>
                    <Button
                        onClick={() => navigate(`/dashboard/admin/events/${eventId}/albums/new`)}
                        variant="primary"
                    >
                        Create First Album
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map(album => (
                        <div
                            key={album.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Cover Image */}
                            <div
                                className="h-40 bg-gray-100 relative cursor-pointer"
                                onClick={() => navigate(`/dashboard/admin/albums/${album.id}/photos`)}
                            >
                                {album.coverImage ? (
                                    <img
                                        src={album.coverImage}
                                        alt={album.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                    {album.mediaCount} {album.mediaCount === 1 ? 'item' : 'items'}
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">{album.name}</h3>

                                {album.groups && album.groups.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {album.groups.slice(0, 3).map(group => (
                                            <span key={group.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                {group.name}
                                            </span>
                                        ))}
                                        {album.groups.length > 3 && (
                                            <span className="text-xs text-gray-400">+{album.groups.length - 3} more</span>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => navigate(`/dashboard/admin/albums/${album.id}/photos`)}
                                        variant="primary"
                                        size="sm"
                                        className="flex-1 py-2"
                                    >
                                        Manage Photos
                                    </Button>
                                    <Button
                                        onClick={() => navigate(`/dashboard/admin/albums/${album.id}/edit`)}
                                        variant="secondary"
                                        size="sm"
                                        className="px-3"
                                        title="Edit"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(album.id)}
                                        variant="danger"
                                        size="sm"
                                        className="px-3"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default EventAlbums
