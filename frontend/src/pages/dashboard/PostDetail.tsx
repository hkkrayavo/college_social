import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api'
import PostRenderer from '../../components/shared/PostRenderer'
import { Button, Avatar } from '../../components/common'

interface Author {
    id: string
    name: string
    avatar?: string
    profilePictureUrl?: string
}

interface Comment {
    id: string
    content: string
    author: Author
    createdAt: string
}

interface Post {
    id: string
    title: string | null
    content: string
    author: Author
    groups: { id: string; name: string }[]
    likesCount: number
    commentsCount: number
    comments: Comment[]
    createdAt: string
}

export function PostDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [post, setPost] = useState<Post | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [liked, setLiked] = useState(false)
    const [likesCount, setLikesCount] = useState(0)

    useEffect(() => {
        if (id) {
            loadPost()
            loadComments()
        }
    }, [id])

    const loadPost = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get<{ success: boolean; data: Post }>(`/posts/${id}`)
            setPost(response.data)
            setLikesCount(response.data.likesCount || 0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load post')
        } finally {
            setLoading(false)
        }
    }

    const loadComments = async () => {
        try {
            const response = await apiClient.get<{ success: boolean; data: Comment[] }>(`/posts/${id}/comments`)
            setComments(response.data || [])
        } catch (err) {
            console.error('Failed to load comments:', err)
        }
    }

    const handleLike = async () => {
        try {
            if (liked) {
                const response = await apiClient.delete<{ success: boolean; likesCount: number }>(`/posts/${id}/like`)
                setLiked(false)
                setLikesCount(response.likesCount || likesCount - 1)
            } else {
                const response = await apiClient.post<{ success: boolean; likesCount: number }>(`/posts/${id}/like`)
                setLiked(true)
                setLikesCount(response.likesCount || likesCount + 1)
            }
        } catch (err) {
            console.error('Failed to toggle like:', err)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    const formatCommentDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        })
    }

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || submitting) return

        setSubmitting(true)
        try {
            await apiClient.post(`/posts/${id}/comments`, { content: newComment.trim() })
            setNewComment('')
            loadComments() // Refresh comments
        } catch (err) {
            console.error('Failed to add comment:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const getReadTime = (content: string): string => {
        try {
            const data = JSON.parse(content)
            let wordCount = 0
            data.blocks?.forEach((block: { data?: { text?: string } }) => {
                if (block.data?.text) {
                    wordCount += block.data.text.split(/\s+/).length
                }
            })
            const minutes = Math.max(1, Math.ceil(wordCount / 200))
            return `${minutes} min read`
        } catch {
            return '1 min read'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-lg font-medium text-red-700">
                        {error || 'Post not found'}
                    </h2>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard/feed')}
                        className="mt-4 text-red-600 hover:text-red-800 underline hover:bg-red-50"
                    >
                        Back to Feed
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>

            {/* Post Content */}
            <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Author Header */}
                <div className="px-6 pt-6 flex items-center gap-4">
                    <Avatar
                        src={(post.author as any)?.profilePictureUrl || post.author?.avatar}
                        name={post.author?.name || 'User'}
                        size="md"
                        className="bg-gradient-to-br from-navy to-gold border-2 border-white shadow-sm"
                    />
                    <div>
                        <div className="font-medium text-gray-900 text-lg">
                            {post.author?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span>{formatDate(post.createdAt)}</span>
                            <span>•</span>
                            <span>{getReadTime(post.content)}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="px-6 py-4 text-3xl font-bold text-gray-900">
                    {post.title || 'Untitled Post'}
                </h1>

                {/* Groups/Tags */}
                {post.groups && post.groups.length > 0 && (
                    <div className="px-6 pb-4 flex flex-wrap gap-2">
                        {post.groups.map(group => (
                            <span
                                key={group.id}
                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 cursor-pointer transition-colors"
                            >
                                #{group.name.toLowerCase().replace(/\s+/g, '')}
                            </span>
                        ))}
                    </div>
                )}

                {/* Post Content */}
                <div className="px-6 pb-6 border-b border-gray-100">
                    <PostRenderer content={post.content} />
                </div>

                {/* Stats Bar */}
                <div className="px-6 py-4 flex items-center gap-6 text-sm border-b border-gray-100">
                    {/* Reactions */}
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                        <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{likesCount} Reactions</span>
                    </button>

                    {/* Comments */}
                    <span className="flex items-center gap-2 text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{post.commentsCount || 0} Comments</span>
                    </span>

                    {/* Bookmark */}
                    <button className="ml-auto flex items-center gap-2 text-gray-500 hover:text-navy transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>Save</span>
                    </button>
                </div>

                {/* Comments Section */}
                <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        Comments ({comments.length})
                    </h3>

                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmitComment} className="mb-6">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white shrink-0">
                                U
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy resize-none"
                                    rows={3}
                                />
                                <div className="mt-2 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        loading={submitting}
                                        size="sm"
                                        variant="primary"
                                        className="bg-navy hover:bg-navy/90"
                                    >
                                        Post Comment
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Comments List */}
                    {comments.length > 0 ? (
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar
                                        src={(comment.author as any)?.profilePictureUrl || comment.author?.avatar}
                                        name={comment.author?.name || 'User'}
                                        size="sm"
                                        className="bg-gradient-to-br from-gray-400 to-gray-500 text-white shrink-0"
                                    />
                                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">
                                                {comment.author?.name || 'Unknown'}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                {formatCommentDate(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-gray-700">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No comments yet. Be the first to comment!</p>
                        </div>
                    )}
                </div>
            </article>
        </div>
    )
}

export default PostDetail
