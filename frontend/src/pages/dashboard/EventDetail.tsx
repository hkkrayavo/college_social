import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { feedService, type AlbumDetail, type AlbumWithMedia } from '../../services/feedService'
import { LikeButton } from '../../components/shared/LikeButton'
import { CommentSection } from '../../components/shared/CommentSection'
import { getMediaUrl } from '../../utils/helpers'
import { apiClient } from '../../services/api'
import { Avatar } from '../../components/common'


interface EventDetailData {
    id: string
    name: string
    date: string
    endDate?: string
    startTime?: string
    endTime?: string
    description?: string
    creator: { id: string; name: string; profilePictureUrl?: string }
    albums: AlbumWithMedia[]
    likesCount: number
    commentsCount: number
    liked: boolean
}

export function EventDetail() {
    const { eventId } = useParams<{ eventId: string }>()
    const [event, setEvent] = useState<EventDetailData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Album viewer state
    const [viewerOpen, setViewerOpen] = useState(false)
    const [viewerAlbum, setViewerAlbum] = useState<AlbumDetail | null>(null)
    const [viewerLoading, setViewerLoading] = useState(false)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [showComments, setShowComments] = useState(false)

    // Dynamic counts
    const [eventCommentsCount, setEventCommentsCount] = useState(0)

    useEffect(() => {
        if (eventId) {
            loadEvent()
        }
    }, [eventId])

    const loadEvent = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get(`/feed/event/${eventId}`) as { event: EventDetailData }
            setEvent(response.event)
            setEventCommentsCount(response.event.commentsCount)
        } catch (err) {
            setError('Failed to load event')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const openAlbumViewer = async (albumId: string) => {
        try {
            setViewerOpen(true)
            setViewerLoading(true)
            setCurrentPhotoIndex(0)
            setShowComments(false)

            const response = await feedService.getAlbumDetail(albumId)
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
        setCurrentPhotoIndex(0)
        setShowComments(false)
    }

    const nextPhoto = () => {
        if (viewerAlbum && currentPhotoIndex < viewerAlbum.media.length - 1) {
            setCurrentPhotoIndex(prev => prev + 1)
        }
    }

    const prevPhoto = () => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(prev => prev - 1)
        }
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!viewerOpen) return
            if (e.key === 'Escape') closeViewer()
            if (e.key === 'ArrowRight') nextPhoto()
            if (e.key === 'ArrowLeft') prevPhoto()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [viewerOpen, currentPhotoIndex, viewerAlbum])

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return null
        const [hours, minutes] = timeStr.split(':')
        const h = parseInt(hours)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const hour12 = h % 12 || 12
        return `${hour12}:${minutes} ${ampm}`
    }

    const currentMedia = viewerAlbum?.media[currentPhotoIndex]

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
                    <div className="h-32 bg-gray-200 rounded mb-6" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-40 bg-gray-200 rounded" />
                        <div className="h-40 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-xl font-medium text-gray-700">{error || 'Event not found'}</h2>
                <Link to="/dashboard/eventfeed" className="mt-4 inline-block text-navy hover:underline">
                    ← Back to Event Feed
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link to="/dashboard/eventfeed" className="inline-flex items-center gap-1 text-gray-500 hover:text-navy mb-6 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Feed
            </Link>

            {/* Event Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Avatar
                                src={event.creator.profilePictureUrl}
                                name={event.creator.name}
                                size="md"
                                className="bg-gradient-to-br from-indigo-500 to-purple-600"
                                fallbackClassName="bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                            />
                            <div>
                                <p className="text-sm text-gray-500">Organized by</p>
                                <p className="font-medium text-gray-900">{event.creator.name}</p>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                        <div className="flex items-center gap-4 mt-3 text-gray-500">
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(event.date)}
                                {event.endDate && event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}
                            </span>
                        </div>
                        {(event.startTime || event.endTime) && (
                            <div className="flex items-center gap-2 mt-2 text-gray-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatTime(event.startTime)}
                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                            </div>
                        )}
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gold/20 text-gold">
                        Event
                    </span>
                </div>

                {event.description && (
                    <p className="mt-6 text-gray-600 leading-relaxed">{event.description}</p>
                )}

                {/* Event Interactions */}
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4">
                    <LikeButton
                        type="events"
                        id={event.id}
                        initialLiked={event.liked}
                        initialCount={event.likesCount}
                        size="md"
                    />
                    <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{eventCommentsCount} Comments</span>
                    </button>
                </div>
            </div>

            {/* Event Comments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>
                <CommentSection type="events" id={event.id} onCountChange={setEventCommentsCount} />
            </div>

            {/* Albums Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Photo Albums ({event.albums.length})
                </h2>

                {event.albums.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📷</div>
                        <p>No albums yet for this event</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {event.albums.map(album => (
                            <AlbumCard key={album.id} album={album} onClick={() => openAlbumViewer(album.id)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Photo Viewer Modal */}
            {viewerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                    onClick={closeViewer}
                >
                    <div
                        className="bg-white w-full max-w-5xl max-h-[95vh] flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Left: Image */}
                        <div className="flex-1 relative bg-gray-100 flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                            {viewerLoading ? (
                                <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full" />
                            ) : currentMedia ? (
                                <>
                                    {currentMedia.mediaType === 'video' ? (
                                        <video
                                            src={getMediaUrl(currentMedia.url)}
                                            controls
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <img
                                            src={getMediaUrl(currentMedia.url)}
                                            alt=""
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    )}

                                    {/* Navigation Arrows */}
                                    {currentPhotoIndex > 0 && (
                                        <button
                                            onClick={prevPhoto}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white shadow-lg rounded-full flex items-center justify-center text-gray-700 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    )}
                                    {viewerAlbum && currentPhotoIndex < viewerAlbum.media.length - 1 && (
                                        <button
                                            onClick={nextPhoto}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white shadow-lg rounded-full flex items-center justify-center text-gray-700 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Photo Counter */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-white text-sm">
                                        {currentPhotoIndex + 1} / {viewerAlbum?.media.length}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Right: Info & Comments */}
                        <div className="w-full md:w-80 bg-white flex flex-col border-t md:border-t-0 md:border-l border-gray-200">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-gray-900 font-semibold">{viewerAlbum?.name}</h3>
                                    <p className="text-gray-500 text-sm">{event?.name}</p>
                                </div>
                                <button onClick={closeViewer} className="text-gray-400 hover:text-gray-700 p-1">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Photo Interactions */}
                            {currentMedia && (
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center gap-4">
                                        <LikeButton
                                            key={currentMedia.id}
                                            type="media"
                                            id={currentMedia.id}
                                            initialLiked={currentMedia.liked}
                                            initialCount={currentMedia.likesCount}
                                            size="md"
                                            onStateChange={(isLiked: boolean, newCount: number) => {
                                                if (viewerAlbum) {
                                                    const updatedMedia = [...viewerAlbum.media]
                                                    updatedMedia[currentPhotoIndex] = {
                                                        ...updatedMedia[currentPhotoIndex],
                                                        liked: isLiked,
                                                        likesCount: newCount
                                                    }
                                                    setViewerAlbum({ ...viewerAlbum, media: updatedMedia })
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => setShowComments(!showComments)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${showComments ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <span className="text-sm">{currentMedia.commentsCount}</span>
                                        </button>
                                    </div>
                                    {currentMedia.caption && (
                                        <p className="mt-3 text-gray-600 text-sm">{currentMedia.caption}</p>
                                    )}
                                </div>
                            )}

                            {/* Comments Section */}
                            {showComments && currentMedia && (
                                <div className="flex-1 p-4 overflow-y-auto">
                                    <CommentSection
                                        type="media"
                                        id={currentMedia.id}
                                        onCountChange={(count) => {
                                            if (viewerAlbum) {
                                                const updatedMedia = [...viewerAlbum.media]
                                                updatedMedia[currentPhotoIndex] = {
                                                    ...updatedMedia[currentPhotoIndex],
                                                    commentsCount: count
                                                }
                                                setViewerAlbum({ ...viewerAlbum, media: updatedMedia })
                                            }
                                        }}
                                    />
                                </div>
                            )}

                            {/* Thumbnail Strip */}
                            {viewerAlbum && viewerAlbum.media.length > 1 && (
                                <div className="p-3 border-t border-gray-200 flex gap-2 overflow-x-auto">
                                    {viewerAlbum.media.map((m, idx) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setCurrentPhotoIndex(idx)}
                                            className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${idx === currentPhotoIndex ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img
                                                src={getMediaUrl(m.url)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default EventDetail

// Album Card Component
function AlbumCard({ album, onClick }: { album: AlbumWithMedia; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col text-left w-full cursor-pointer bg-gray-50 rounded-lg overflow-hidden border border-gray-100 hover:border-navy/30 hover:shadow-md transition-all duration-300"
            title={album.name}
        >
            <div className="relative aspect-[4/3] w-full bg-gray-200 overflow-hidden">
                {album.photos.length > 0 ? (
                    <img
                        src={getMediaUrl(album.photos[0].url)}
                        alt={album.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Photo Count */}
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {album.photoCount}
                </div>
            </div>

            <div className="p-3">
                <h3 className="font-semibold text-gray-900 group-hover:text-navy transition-colors truncate">
                    {album.name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                    {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
                </p>
            </div>
        </button>
    )
}
