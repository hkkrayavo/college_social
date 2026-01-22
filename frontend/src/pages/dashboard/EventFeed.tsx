import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { feedService, type FeedItem, type AlbumDetail, type AlbumWithMedia } from '../../services/feedService'
import { LikeButton } from '../../components/shared/LikeButton'
import { LikersList } from '../../components/shared/LikersList'
import { CommentSection } from '../../components/shared/CommentSection'
import { getMediaUrl } from '../../utils/helpers'
import { Avatar } from '../../components/common'

export function EventFeed() {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    // Album viewer state
    const [viewerOpen, setViewerOpen] = useState(false)
    const [viewerAlbum, setViewerAlbum] = useState<AlbumDetail | null>(null)
    const [viewerLoading, setViewerLoading] = useState(false)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
    const [showComments, setShowComments] = useState(false)
    const [showLikers, setShowLikers] = useState(false)

    const loadFeed = useCallback(async (pageNum: number, append = false) => {
        try {
            setLoading(true)
            const response = await feedService.getFeed(pageNum, 10)

            if (append) {
                setFeedItems(prev => [...prev, ...response.data])
            } else {
                setFeedItems(response.data)
            }

            setHasMore(pageNum < response.pagination.totalPages)
        } catch (err) {
            console.error('Failed to load feed:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadFeed(1)
    }, [loadFeed])

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1
            setPage(nextPage)
            loadFeed(nextPage, true)
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
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

        if (diffHours < 1) return 'Just now'
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffHours < 48) return 'Yesterday'
        return formatDate(dateStr)
    }

    const currentMedia = viewerAlbum?.media[currentPhotoIndex]

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Event Feed</h1>
                <p className="text-gray-500 mt-1">Events and albums from your community</p>
            </div>

            {/* Feed Items */}
            {loading && feedItems.length === 0 ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-24" />
                                    <div className="h-3 bg-gray-200 rounded w-16" />
                                </div>
                            </div>
                            <div className="h-48 bg-gray-200 rounded-lg mb-4" />
                            <div className="h-5 bg-gray-200 rounded w-3/4" />
                        </div>
                    ))}
                </div>
            ) : feedItems.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                    <div className="text-5xl mb-4">📸</div>
                    <h3 className="text-lg font-medium text-gray-700">No events yet</h3>
                    <p className="text-gray-500 mt-1">Events and albums will appear here</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {feedItems.map(item => (
                        <EventCard
                            key={item.id}
                            item={item}
                            onAlbumClick={openAlbumViewer}
                            formatRelativeTime={formatRelativeTime}
                            formatDate={formatDate}
                        />
                    ))}

                    {/* Load More */}
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="w-full py-3 text-center text-navy font-medium hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Load more'}
                        </button>
                    )}
                </div>
            )}

            {/* Photo Viewer Modal */}
            {viewerOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
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
                                    <p className="text-gray-500 text-sm">{viewerAlbum?.event?.name}</p>
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
                                    <div className="flex items-center gap-3">
                                        {/* Like Button for like/unlike action */}
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
                                        {/* View Likers Button */}
                                        <button
                                            onClick={() => { setShowLikers(!showLikers); setShowComments(false); }}
                                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${showLikers ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                                            title="View who liked"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        {/* Comments Button */}
                                        <button
                                            onClick={() => { setShowComments(!showComments); setShowLikers(false); }}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors cursor-pointer ${showComments ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            title="Comments"
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

                            {/* Likers Section */}
                            {showLikers && currentMedia && (
                                <div className="flex-1 p-4 overflow-y-auto">
                                    <LikersList
                                        key={`${currentMedia.id}-${currentMedia.likesCount}`}
                                        type="media"
                                        id={currentMedia.id}
                                        compact={false}
                                        initialCount={currentMedia.likesCount}
                                    />
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
                                            className={`relative flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${idx === currentPhotoIndex ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            {m.mediaType === 'video' ? (
                                                <>
                                                    <video
                                                        src={getMediaUrl(m.url)}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                    />
                                                    {/* Video indicator */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                        </svg>
                                                    </div>
                                                </>
                                            ) : (
                                                <img
                                                    src={getMediaUrl(m.url)}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
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

// Event Card Component
interface EventCardProps {
    item: FeedItem
    onAlbumClick: (albumId: string) => void
    formatRelativeTime: (date: string) => string
    formatDate: (date: string) => string
}

function EventCard({ item, onAlbumClick, formatRelativeTime, formatDate }: EventCardProps) {
    const [showComments, setShowComments] = useState(false)
    const [showLikers, setShowLikers] = useState(false)
    const [commentsCount, setCommentsCount] = useState(item.commentsCount)
    const [likesCount, setLikesCount] = useState(item.likesCount)
    const { eventData } = item

    return (
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Author Header */}
            <div className="px-5 pt-5 flex items-center gap-3">
                <Avatar
                    src={item.creator.profilePictureUrl}
                    name={item.creator.name || 'User'}
                    size="md"
                    className="bg-gradient-to-br from-navy to-gold"
                    fallbackClassName="bg-gradient-to-br from-navy to-gold text-white"
                />
                <div>
                    <div className="font-medium text-gray-900">{item.creator.name}</div>
                    <div className="text-sm text-gray-500">{formatRelativeTime(item.createdAt)}</div>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold">
                    Event
                </span>
            </div>

            {/* Event Content */}
            <div className="px-5 py-4">
                <Link to={`/dashboard/user/events/${item.id}`} className="text-xl font-bold text-gray-900 hover:text-navy transition-colors">
                    {eventData.name}
                </Link>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(eventData.date)}
                        {eventData.endDate && ` - ${formatDate(eventData.endDate)}`}
                    </span>
                </div>

                {eventData.description && (
                    <p className="mt-3 text-gray-600 text-sm line-clamp-2">{eventData.description}</p>
                )}

                {/* Albums with Photos */}
                {eventData.albums.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                            {eventData.albumCount} Album{eventData.albumCount !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {eventData.albums.map(album => (
                                <AlbumPreview key={album.id} album={album} onAlbumClick={onAlbumClick} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
                {/* Like Button for like/unlike */}
                <LikeButton
                    type="events"
                    id={item.id}
                    initialLiked={item.liked}
                    initialCount={item.likesCount}
                    size="sm"
                    onStateChange={(_liked, count) => setLikesCount(count)}
                />
                {/* View Likers Button */}
                <button
                    onClick={() => { setShowLikers(!showLikers); setShowComments(false); }}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${showLikers ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                    title="View who liked"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
                {/* Comments Button */}
                <button
                    onClick={() => { setShowComments(!showComments); setShowLikers(false); }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-colors cursor-pointer ${showComments ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title="Comments"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{commentsCount}</span>
                </button>

                {/* View Details Link */}
                <Link
                    to={`/dashboard/user/events/${item.id}`}
                    className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-navy hover:bg-navy/10 transition-colors"
                >
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* Likers */}
            {showLikers && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-4">
                    <LikersList key={`${item.id}-${likesCount}`} type="events" id={item.id} compact={false} initialCount={likesCount} />
                </div>
            )}

            {/* Comments */}
            {showComments && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-4">
                    <CommentSection type="events" id={item.id} onCountChange={setCommentsCount} />
                </div>
            )}
        </article>
    )
}

// Album Preview inside Event Card
function AlbumPreview({ album, onAlbumClick }: { album: AlbumWithMedia; onAlbumClick: (id: string) => void }) {
    const firstMedia = album.photos[0]
    const isVideo = firstMedia && /\.(mp4|webm|mov|avi|mkv)$/i.test(firstMedia.url)

    return (
        <button
            onClick={() => onAlbumClick(album.id)}
            className="group flex flex-col gap-1 w-[72px] flex-shrink-0 cursor-pointer"
            title={album.name}
        >
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 group-hover:border-navy transition-all duration-300 shadow-sm">
                {album.photos.length > 0 ? (
                    isVideo ? (
                        <>
                            <video
                                src={getMediaUrl(firstMedia.url)}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                muted
                                preload="metadata"
                            />
                            {/* Video play icon */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                            </div>
                        </>
                    ) : (
                        <img
                            src={getMediaUrl(firstMedia.url)}
                            alt={album.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                        />
                    )
                ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Media Count Overlay (Small) */}
                {album.photoCount > 1 && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 pt-4 flex justify-end">
                        <span className="text-[10px] font-bold text-white flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {album.photoCount}
                        </span>
                    </div>
                )}
            </div>
            <span className="text-[11px] leading-tight text-gray-600 truncate w-full text-center group-hover:text-navy transition-colors">
                {album.name}
            </span>
        </button>
    )
}

export default EventFeed
