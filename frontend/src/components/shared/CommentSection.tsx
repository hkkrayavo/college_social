import { useState, useEffect } from 'react'
import { interactionService, type InteractionType, type CommentItem } from '../../services/interactionService'
import { useAuthContext } from '../../context/AuthContext'
import { Avatar } from '../common'

interface CommentSectionProps {
    type: InteractionType
    id: string
    compact?: boolean
    dark?: boolean
    onCountChange?: (count: number) => void
}

export function CommentSection({ type, id, compact = false, dark = false, onCountChange }: CommentSectionProps) {
    const { user } = useAuthContext()
    const [comments, setComments] = useState<CommentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [expanded, setExpanded] = useState(!compact)
    const [deleteArmed, setDeleteArmed] = useState<string | null>(null)

    useEffect(() => {
        if (expanded) {
            loadComments()
        }
    }, [expanded, type, id])

    const loadComments = async () => {
        try {
            setLoading(true)
            const res = await interactionService.getComments(type, id)
            setComments(res.comments)
            onCountChange?.(res.comments.length)
        } catch (err) {
            console.error('Failed to load comments:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || submitting) return

        try {
            setSubmitting(true)
            const res = await interactionService.addComment(type, id, newComment.trim())
            setComments(prev => {
                const updated = [res.comment, ...prev]
                onCountChange?.(updated.length)
                return updated
            })
            setNewComment('')
        } catch (err) {
            console.error('Failed to add comment:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = async (commentId: string) => {
        if (deleteArmed === commentId) {
            // Second click - actually delete
            try {
                await interactionService.deleteComment(commentId)
                setComments(prev => {
                    const updated = prev.filter(c => c.id !== commentId)
                    onCountChange?.(updated.length)
                    return updated
                })
                setDeleteArmed(null)
            } catch (err) {
                console.error('Failed to delete comment:', err)
            }
        } else {
            // First click - arm the delete
            setDeleteArmed(commentId)
            // Auto-disarm after 3 seconds
            setTimeout(() => {
                setDeleteArmed(prev => prev === commentId ? null : prev)
            }, 3000)
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))

        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        if (hours < 48) return 'Yesterday'
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    // Compact toggle button
    if (compact && !expanded) {
        return (
            <button
                onClick={() => setExpanded(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${dark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Comments</span>
            </button>
        )
    }

    return (
        <div className="space-y-3">
            {compact && (
                <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Comments ({comments.length})
                    </h4>
                    <button
                        onClick={() => setExpanded(false)}
                        className={`p-1 ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Add Comment Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className={`flex-1 px-3 py-2 text-sm rounded-lg outline-none transition-colors ${dark
                        ? 'bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-gold/50 focus:border-gold'
                        : 'border border-gray-200 focus:ring-2 focus:ring-navy/20 focus:border-navy'
                        }`}
                    disabled={submitting}
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className={`px-4 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${dark
                        ? 'bg-gold text-navy font-medium hover:bg-gold/90'
                        : 'bg-navy text-white hover:bg-navy/90'
                        }`}
                >
                    {submitting ? '...' : 'Post'}
                </button>
            </form>

            {/* Comments List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {loading ? (
                    <div className="text-center py-4">
                        <div className={`animate-spin w-5 h-5 border-2 rounded-full mx-auto ${dark ? 'border-gray-600 border-t-gold' : 'border-navy/20 border-t-navy'
                            }`}></div>
                    </div>
                ) : comments.length === 0 ? (
                    <p className={`text-center text-sm py-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        No comments yet
                    </p>
                ) : (
                    comments.map(comment => (
                        <div
                            key={comment.id}
                            className={`flex gap-2 p-2 rounded-lg group ${dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                }`}
                        >
                            <Avatar
                                src={comment.author.profilePictureUrl}
                                name={comment.author.name}
                                size="sm"
                                fallbackClassName={dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${dark ? 'text-white' : 'text-gray-800'}`}>
                                        {comment.author.name}
                                    </span>
                                    <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {formatTime(comment.createdAt)}
                                    </span>
                                </div>
                                <p className={`text-sm break-words ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {comment.content}
                                </p>
                            </div>
                            {user?.id === comment.author.id && (
                                <button
                                    onClick={() => handleDeleteClick(comment.id)}
                                    title={deleteArmed === comment.id ? "Click again to confirm delete" : "Click to delete"}
                                    className={`p-1 transition-all ${deleteArmed === comment.id
                                        ? 'opacity-100 text-red-500 bg-red-100 rounded animate-pulse'
                                        : `opacity-0 group-hover:opacity-100 ${dark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

