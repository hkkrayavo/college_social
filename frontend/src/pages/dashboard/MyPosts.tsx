import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../services/api'
import { Button, Modal, Avatar } from '../../components/common'

interface Author {
    id: string
    name: string
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
    comments?: Comment[]
    status: 'approved' | 'pending' | 'rejected'
    createdAt: string
}

export function MyPosts() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [postToDelete, setPostToDelete] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get<{ success: boolean; data: Post[] }>('/posts?mine=true')
            setPosts(response.data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load your posts')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, postId: string) => {
        e.preventDefault()
        setPostToDelete(postId)
        setDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!postToDelete) return

        try {
            setDeleting(true)
            await apiClient.delete(`/posts/${postToDelete}`)
            setPosts(prev => prev.filter(p => p.id !== postToDelete))
            setDeleteModalOpen(false)
            setPostToDelete(null)
        } catch (err) {
            console.error('Failed to delete post:', err)
            // Optional: Show error toast/message
        } finally {
            setDeleting(false)
        }
    }

    const formatDate = (dateStr: string) => {
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
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        })
    }

    const getReadTime = (content: string): string => {
        try {
            const data = JSON.parse(content)
            let wordCount = 0
            if (data.blocks) {
                data.blocks.forEach((block: { data?: { text?: string } }) => {
                    if (block.data?.text) {
                        wordCount += block.data.text.split(/\s+/).length
                    }
                })
            }
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

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
                <button onClick={loadPosts} className="ml-4 underline hover:text-red-800">Retry</button>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Posts</h1>
                    <p className="text-gray-500 mt-1">Manage your shared content</p>
                </div>
                <Link
                    to="/dashboard/posts/new"
                    className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Post
                </Link>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
                    <div className="text-gray-400 text-5xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
                    <p className="text-gray-500 mt-1">You haven't created any posts yet.</p>
                    <Link
                        to="/dashboard/posts/new"
                        className="inline-block mt-4 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
                    >
                        Create Your First Post
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <article
                            key={post.id}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-indigo-300 transition-colors shadow-sm"
                        >
                            {/* Author Header */}
                            <div className="px-5 pt-5 flex items-center gap-3">
                                <Avatar
                                    src={post.author?.profilePictureUrl}
                                    name={post.author?.name || 'User'}
                                    size="md"
                                    className="bg-gradient-to-br from-navy to-gold"
                                    fallbackClassName="bg-gradient-to-br from-navy to-gold text-white"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {post.author?.name || 'Unknown'} (You)
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formatDate(post.createdAt)}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${post.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    post.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {post.status}
                                </div>

                                <div className="ml-auto">
                                    <button
                                        onClick={(e) => handleDeleteClick(e, post.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Post"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <Link to={`/dashboard/posts/${post.id}`} className="block px-5 py-3">
                                <h2 className="text-xl font-bold text-gray-900 hover:text-navy transition-colors">
                                    {post.title || 'Untitled Post'}
                                </h2>
                            </Link>

                            {/* Groups/Tags */}
                            {post.groups && post.groups.length > 0 && (
                                <div className="px-5 pb-3 flex flex-wrap gap-2">
                                    {post.groups.map(group => (
                                        <span
                                            key={group.id}
                                            className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                                        >
                                            #{group.name.toLowerCase().replace(/\s+/g, '')}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Stats Row */}
                            <div className="px-5 pb-4 flex items-center gap-6 text-sm text-gray-500 border-t border-gray-50 pt-3 mt-1">
                                <div className="flex items-center gap-1.5 text-navy font-medium">
                                    <span>❤️</span>
                                    <span>{post.likesCount || 0} Reactions</span>
                                </div>

                                <Link
                                    to={`/dashboard/posts/${post.id}`}
                                    className="flex items-center gap-1.5 hover:text-navy transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{post.commentsCount || 0} Comments</span>
                                </Link>

                                <span className="ml-auto">{getReadTime(post.content)}</span>
                            </div>
                        </article>
                    ))}
                </div>
            )}
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Post"
                size="sm"
                footer={
                    <div className="flex w-full gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModalOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            loading={deleting}
                            className="flex-1"
                        >
                            Delete
                        </Button>
                    </div>
                }
            >
                <div className="text-gray-600">
                    <p>Are you sure you want to delete this post?</p>
                    <p className="text-sm mt-2 text-red-600 font-medium">This action cannot be undone.</p>
                </div>
            </Modal>
        </div>
    )
}
