import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService, type AlbumDetail } from '../../services/adminService'
import { getMediaUrl } from '../../utils/helpers'
import { Button } from '../../components/common/Button'


export function AlbumPhotos() {
    const { albumId } = useParams<{ albumId: string }>()
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [album, setAlbum] = useState<AlbumDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const loadAlbum = useCallback(async () => {
        if (!albumId) return

        try {
            setLoading(true)
            const response = await adminService.getAlbum(albumId)
            setAlbum(response)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load album')
        } finally {
            setLoading(false)
        }
    }, [albumId])

    useEffect(() => {
        loadAlbum()
    }, [loadAlbum])

    // Handle file upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !albumId) return

        setUploading(true)
        setUploadProgress(0)

        try {
            const totalFiles = files.length
            let uploaded = 0

            for (const file of Array.from(files)) {
                await adminService.addAlbumMedia(albumId, file)

                uploaded++
                setUploadProgress(Math.round((uploaded / totalFiles) * 100))
            }

            // Reload album to show new media
            await loadAlbum()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload files')
        } finally {
            setUploading(false)
            setUploadProgress(0)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    // Handle media delete
    const handleDeleteMedia = async (mediaId: string) => {
        if (!albumId) return

        try {
            await adminService.removeAlbumMedia(albumId, mediaId)
            setAlbum(prev => prev ? {
                ...prev,
                media: prev.media.filter(m => m.id !== mediaId)
            } : null)
            setDeleteConfirm(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete media')
        }
    }

    // Navigate back to event albums or events
    const handleBack = () => {
        if (album?.event?.id) {
            navigate(`/dashboard/admin/events/${album.event.id}/albums`)
        } else {
            navigate('/dashboard/admin/events')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading album...</p>
                </div>
            </div>
        )
    }

    if (error || !album) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                {error || 'Album not found'}
                <Button onClick={loadAlbum} variant="ghost" className="ml-4 underline text-red-700 hover:text-red-800 hover:bg-red-100 p-0 h-auto">Retry</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleBack}
                        variant="ghost"
                        className="text-gray-500 hover:text-navy"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-navy">{album.name}</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {album.event && (
                                <>
                                    {album.event.name}
                                    {album.event.date && ` • ${new Date(album.event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
                                    {' • '}
                                </>
                            )}
                            {album.media.length} item{album.media.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={handleBack}
                        variant="ghost"
                        className="text-navy hover:underline text-sm"
                    >
                        ← Back to Albums
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2"
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        }
                    >
                        {uploading ? `Uploading ${uploadProgress}%` : 'Add Media'}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
                <div className="bg-navy/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-navy">Uploading...</span>
                        <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-navy rounded-full h-2 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Media Grid */}
            {album.media.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <svg className="w-14 h-14 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 mb-4">No photos or videos in this album yet</p>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="primary"
                    >
                        Upload Media
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {album.media.map(media => (
                        <div
                            key={media.id}
                            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
                        >
                            {media.mediaType === 'video' ? (
                                <div className="relative w-full h-full">
                                    <video
                                        src={getMediaUrl(media.mediaUrl)}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Play button overlay for videos */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:opacity-0 transition-opacity">
                                            <svg className="w-6 h-6 text-navy ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={getMediaUrl(media.mediaUrl)}
                                    alt={media.caption || 'Album media'}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            )}

                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a
                                    href={getMediaUrl(media.mediaUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                    title="View full size"
                                >
                                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </a>
                                <button
                                    onClick={() => setDeleteConfirm(media.id)}
                                    className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                                    title="Delete"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* Video badge */}
                            {media.mediaType === 'video' && (
                                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                    Video
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Delete Media?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this item? This cannot be undone.</p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setDeleteConfirm(null)}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleDeleteMedia(deleteConfirm)}
                                variant="danger"
                                className="flex-1"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AlbumPhotos
