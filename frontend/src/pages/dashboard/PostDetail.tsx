import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api'
import PostRenderer from '../../components/shared/PostRenderer'
import { Button, Avatar } from '../../components/common'
import { LikersList } from '../../components/shared/LikersList'
import { CommentSection } from '../../components/shared/CommentSection'
import { LikeButton } from '../../components/shared/LikeButton'

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
    liked?: boolean
}

export function PostDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showLikers, setShowLikers] = useState(false)
    const [likersKey, setLikersKey] = useState(0)
    const [likesCount, setLikesCount] = useState(0)

    useEffect(() => {
        if (id) {
            loadPost()

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





    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
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

                {/* Actions Bar */}
                <div className="px-6 py-4 flex items-center gap-4 text-sm border-b border-gray-100">
                    <LikeButton
                        type="posts"
                        id={id!}
                        initialLiked={post.liked || false}
                        initialCount={likesCount}
                        size="md"
                        onStateChange={(_liked: boolean, count: number) => {
                            setLikesCount(count)
                            setLikersKey(prev => prev + 1)
                        }}
                    />

                    {/* View Likers Button */}
                    <button
                        onClick={() => setShowLikers(!showLikers)}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${showLikers ? 'bg-red-50 text-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'}`}
                        title="View who liked"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>

                    {/* Comments Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-medium">{post.commentsCount || 0}</span>
                    </div>

                    {/* Bookmark */}
                    <button className="ml-auto flex items-center gap-2 text-gray-500 hover:text-navy transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>Save</span>
                    </button>
                </div>

                {/* Likers List */}
                {showLikers && (
                    <div className="px-6 py-3 border-b border-gray-100">
                        <LikersList key={likersKey} type="posts" id={id!} compact={false} initialCount={likesCount} />
                    </div>
                )}

                {/* Comments Section */}
                <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                        Comments
                    </h3>
                    <CommentSection
                        type="posts"
                        id={id!}
                        onCountChange={(count) => setPost(prev => prev ? { ...prev, commentsCount: count } : null)}
                    />
                </div>
            </article>
        </div>
    )
}

export default PostDetail
