import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../services/api'
import { Avatar } from '../../components/common'

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
    createdAt: string
}

export function PostFeed() {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get<{ success: boolean; data: Post[] }>('/posts')
            setPosts(response.data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load posts')
        } finally {
            setLoading(false)
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

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
                <p className="text-gray-500 mt-1">Latest posts from the community</p>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 text-5xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
                    <p className="text-gray-500 mt-1">Be the first to share something!</p>
                    <Link
                        to="/dashboard/posts/new"
                        className="inline-block mt-4 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
                    >
                        Create Post
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <article
                            key={post.id}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
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
                                        {post.author?.name || 'Unknown'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {formatDate(post.createdAt)}
                                    </div>
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
                                            className="text-sm text-gray-500 hover:text-navy cursor-pointer"
                                        >
                                            #{group.name.toLowerCase().replace(/\s+/g, '')}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Stats Row */}
                            <div className="px-5 pb-4 flex items-center gap-6 text-sm text-gray-500">
                                {/* Reactions */}
                                <div className="flex items-center gap-1.5">
                                    <span className="flex -space-x-1">
                                        <span className="text-base">❤️</span>
                                        <span className="text-base">🎉</span>
                                    </span>
                                    <span>{post.likesCount || 0} Reactions</span>
                                </div>

                                {/* Comments */}
                                <Link
                                    to={`/dashboard/posts/${post.id}`}
                                    className="flex items-center gap-1.5 hover:text-navy transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span>{post.commentsCount || 0} Comments</span>
                                </Link>

                                {/* Read Time */}
                                <span className="ml-auto">{getReadTime(post.content)}</span>

                                {/* Bookmark */}
                                <button className="p-1 hover:text-navy transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Comments Preview */}
                            {post.comments && post.comments.length > 0 && (
                                <div className="border-t border-gray-100">
                                    {post.comments.slice(0, 2).map(comment => (
                                        <div key={comment.id} className="px-5 py-3 bg-gray-50 border-b border-gray-100 last:border-b-0">
                                            <div className="flex items-start gap-3">
                                                <Avatar
                                                    src={comment.author?.profilePictureUrl}
                                                    name={comment.author?.name || 'User'}
                                                    size="sm"
                                                    className="bg-gradient-to-br from-gray-400 to-gray-500"
                                                    fallbackClassName="bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium text-gray-900">
                                                            {comment.author?.name || 'Unknown'}
                                                        </span>
                                                        <span className="text-gray-400">
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 mt-0.5 text-sm">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {post.commentsCount > 2 && (
                                        <Link
                                            to={`/dashboard/posts/${post.id}`}
                                            className="block px-5 py-3 text-sm text-gray-600 hover:text-navy transition-colors"
                                        >
                                            See all {post.commentsCount} comments
                                        </Link>
                                    )}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}

export default PostFeed
