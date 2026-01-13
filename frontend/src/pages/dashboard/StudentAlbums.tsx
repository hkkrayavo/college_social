import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../services/api'
import { getMediaUrl } from '../../utils/helpers'
import { LikeButton } from '../../components/shared/LikeButton'
import { CommentSection } from '../../components/shared/CommentSection'

interface EventItem {
    id: string
    name: string
    date: string
    endDate: string | null
    startTime: string | null
    endTime: string | null
    description: string | null
    albumCount: number
}

interface AlbumItem {
    id: string
    name: string
    description: string | null
    coverImage: string | null
    mediaCount: number
    event: { id: string; name: string; date: string }
}

interface MediaItem {
    id: string
    mediaUrl: string
    mediaType: string
    caption: string | null
}

interface AlbumDetail {
    id: string
    name: string
    media: MediaItem[]
}

export function StudentAlbums() {
    const [events, setEvents] = useState<EventItem[]>([])
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
    const [albums, setAlbums] = useState<AlbumItem[]>([])
    const [loading, setLoading] = useState(true)
    const [albumsLoading, setAlbumsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Image viewer state
    const [viewerOpen, setViewerOpen] = useState(false)
    const [viewerAlbum, setViewerAlbum] = useState<AlbumDetail | null>(null)
    const [viewerLoading, setViewerLoading] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const loadEvents = useCallback(async () => {
        try {
            setLoading(true)
            const response = await apiClient.get<{ success: boolean; data: EventItem[] }>('/events')
            setEvents(response.data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load events')
        } finally {
            setLoading(false)
        }
    }, [])

    const loadAlbums = async (eventId: string) => {
        try {
            setAlbumsLoading(true)
            const response = await apiClient.get<{ success: boolean; data: AlbumItem[] }>(`/events/${eventId}/albums`)
            setAlbums(response.data || [])
        } catch (err) {
            console.error('Failed to load albums:', err)
        } finally {
            setAlbumsLoading(false)
        }
    }

    const openAlbumViewer = async (album: AlbumItem) => {
        try {
            setViewerOpen(true)
            setViewerLoading(true)
            setCurrentImageIndex(0)

            const response = await apiClient.get<{ success: boolean; album: AlbumDetail }>(`/albums/${album.id}`)
            setViewerAlbum(response.album)
        } catch (err) {
            console.error('Failed to load album:', err)
            setViewerOpen(false)
        } finally {
            setViewerLoading(false)
        }
    }

    const closeViewer = () => {
        setViewerOpen(false)
        setViewerAlbum(null)
        setCurrentImageIndex(0)
    }

    const nextImage = () => {
        if (viewerAlbum && currentImageIndex < viewerAlbum.media.length - 1) {
            setCurrentImageIndex(prev => prev + 1)
        }
    }

    const prevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(prev => prev - 1)
        }
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!viewerOpen) return
            if (e.key === 'Escape') closeViewer()
            if (e.key === 'ArrowRight') nextImage()
            if (e.key === 'ArrowLeft') prevImage()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [viewerOpen, currentImageIndex, viewerAlbum])

    useEffect(() => {
        loadEvents()
    }, [loadEvents])

    const handleEventClick = (eventId: string) => {
        if (selectedEvent === eventId) {
            setSelectedEvent(null)
            setAlbums([])
        } else {
            setSelectedEvent(eventId)
            loadAlbums(eventId)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const formatTime = (timeStr: string) => {
        return timeStr.slice(0, 5)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading events...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                {error}
                <button onClick={loadEvents} className="ml-4 underline">Retry</button>
            </div>
        )
    }

    const currentMedia = viewerAlbum?.media[currentImageIndex]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-navy">Events & Albums</h1>
                <p className="text-gray-500 mt-1">Browse photos from college events shared with your groups</p>
            </div>

            {events.length === 0 ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>No events available yet.</p>
                        <p className="text-sm mt-2">Events shared with your groups will appear here.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {events.map(event => (
                        <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Event Header */}
                            <button
                                onClick={() => handleEventClick(event.id)}
                                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{event.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(event.date)}
                                            {event.endDate && event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}
                                            {' • '}
                                            {event.albumCount} album{event.albumCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${selectedEvent === event.id ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Expanded Content */}
                            {selectedEvent === event.id && (
                                <div className="border-t border-gray-100">
                                    {/* Event Details Section */}
                                    <div className="p-4 bg-cream/30 border-b border-gray-100">
                                        {/* Description */}
                                        {event.description && (
                                            <div className="flex items-start gap-3 mb-4">
                                                <svg className="w-5 h-5 text-navy mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-navy mb-1">About this Event</h4>
                                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Date & Time Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Date */}
                                            <div className="flex items-center gap-3">
                                                <svg className="w-5 h-5 text-navy flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">Date: </span>
                                                    {formatDate(event.date)}
                                                    {event.endDate && event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}
                                                </div>
                                            </div>

                                            {/* Time */}
                                            {(event.startTime || event.endTime) && (
                                                <div className="flex items-center gap-3">
                                                    <svg className="w-5 h-5 text-navy flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Time: </span>
                                                        {event.startTime && formatTime(event.startTime)}
                                                        {event.startTime && event.endTime && ' - '}
                                                        {event.endTime && formatTime(event.endTime)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Event Interactions */}
                                        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-start gap-4">
                                            <LikeButton type="events" id={event.id} size="sm" />
                                            <CommentSection type="events" id={event.id} compact />
                                        </div>
                                    </div>

                                    {/* Albums Section */}
                                    <div className="bg-gray-50 p-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                                            Albums ({event.albumCount})
                                        </h4>

                                        {albumsLoading ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full mx-auto"></div>
                                            </div>
                                        ) : albums.length === 0 ? (
                                            <p className="text-center py-8 text-gray-400">No albums available for this event</p>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {albums.map(album => (
                                                    <button
                                                        key={album.id}
                                                        onClick={() => openAlbumViewer(album)}
                                                        className="group text-left"
                                                    >
                                                        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative">
                                                            {album.coverImage ? (
                                                                <img
                                                                    src={getMediaUrl(album.coverImage)}
                                                                    alt={album.name}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                                                <p className="text-white text-sm font-medium truncate">{album.name}</p>
                                                                <p className="text-white/70 text-xs">{album.mediaCount} photos</p>
                                                            </div>
                                                            {/* Hover overlay */}
                                                            <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <div className="bg-white rounded-full p-3">
                                                                    <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Image Viewer Modal */}
            {viewerOpen && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex flex-col"
                    onClick={closeViewer}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 text-white" onClick={e => e.stopPropagation()}>
                        <div>
                            <h2 className="text-lg font-semibold">{viewerAlbum?.name}</h2>
                            {viewerAlbum && (
                                <p className="text-white/60 text-sm">
                                    {currentImageIndex + 1} / {viewerAlbum.media.length}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={closeViewer}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Image Container */}
                    <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
                        {viewerLoading ? (
                            <div className="text-white">
                                <div className="animate-spin w-10 h-10 border-4 border-white/20 border-t-white rounded-full"></div>
                            </div>
                        ) : currentMedia ? (
                            <>
                                {/* Previous Button */}
                                <button
                                    onClick={prevImage}
                                    disabled={currentImageIndex === 0}
                                    className={`absolute left-4 p-3 rounded-full transition-colors ${currentImageIndex === 0
                                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {/* Main Image/Video */}
                                <div className="max-w-5xl max-h-[80vh] flex items-center justify-center">
                                    {currentMedia.mediaType === 'video' ? (
                                        <video
                                            src={getMediaUrl(currentMedia.mediaUrl)}
                                            controls
                                            className="max-w-full max-h-[80vh] rounded-lg"
                                        />
                                    ) : (
                                        <img
                                            src={getMediaUrl(currentMedia.mediaUrl)}
                                            alt={currentMedia.caption || 'Photo'}
                                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                                        />
                                    )}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={nextImage}
                                    disabled={!viewerAlbum || currentImageIndex >= viewerAlbum.media.length - 1}
                                    className={`absolute right-4 p-3 rounded-full transition-colors ${!viewerAlbum || currentImageIndex >= viewerAlbum.media.length - 1
                                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <p className="text-white/60">No photos in this album</p>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {viewerAlbum && viewerAlbum.media.length > 1 && (
                        <div
                            className="p-4 flex gap-2 overflow-x-auto justify-center"
                            onClick={e => e.stopPropagation()}
                        >
                            {viewerAlbum.media.map((media, index) => (
                                <button
                                    key={media.id}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                        ? 'border-white scale-110'
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img
                                        src={getMediaUrl(media.mediaUrl)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Caption */}
                    {currentMedia?.caption && (
                        <div className="p-4 text-center text-white/80" onClick={e => e.stopPropagation()}>
                            {currentMedia.caption}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default StudentAlbums
