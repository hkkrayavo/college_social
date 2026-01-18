import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../services/api'
import { Button, Modal } from '../../components/common'

import { PostCard } from '../../components/shared/PostCard'
import type { Post } from '../../types/posts.types'

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
                    to="/dashboard/user/posts/new"
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
                        to="/dashboard/user/posts/new"
                        className="inline-block mt-4 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
                    >
                        Create Your First Post
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onDelete={handleDeleteClick}
                            showStatus={true}
                        />
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
