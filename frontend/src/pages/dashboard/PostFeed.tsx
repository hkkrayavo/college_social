import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../services/api'


import { PostCard } from '../../components/shared/PostCard'
import type { Post } from '../../types/posts.types'


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
                        to="/dashboard/user/posts/new"
                        className="inline-block mt-4 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
                    >
                        Create Post
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}



export default PostFeed
