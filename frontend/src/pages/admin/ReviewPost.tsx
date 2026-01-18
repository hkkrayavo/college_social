import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService, type PostItem } from '../../services/adminService'
import { Button } from '../../components/common'
import { GroupSelector } from '../../components/shared/GroupSelector'
import type { OutputData } from '@editorjs/editorjs'
import { PostRenderer } from '../../components/shared/PostRenderer'

export function ReviewPost() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [post, setPost] = useState<PostItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [status, setStatus] = useState<'review' | 'rejecting'>('review')
    const [rejectReason, setRejectReason] = useState('')
    // We now track full group objects for the selector
    const [selectedGroups, setSelectedGroups] = useState<{ id: string; name: string }[]>([])
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (id) {
            loadData(id)
        }
    }, [id])

    const loadData = async (postId: string) => {
        try {
            setLoading(true)
            const postData = await adminService.getPost(postId)
            setPost(postData)

            // Initialize selected groups from post data
            if (postData.groups) {
                setSelectedGroups(postData.groups.map(g => ({ id: g.id, name: g.name })))
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleGroupSelectionChange = (groups: { id: string; name: string }[]) => {
        setSelectedGroups(groups)
    }

    const handleApprove = async () => {
        if (!post) return
        try {
            setSubmitting(true)
            await adminService.approvePost(post.id, selectedGroups.map(g => g.id))
            navigate('/dashboard/admin/posts/pending', { state: { message: 'Post approved successfully' } })
        } catch (err) {
            console.error('Failed to approve:', err)
            alert('Failed to approve post')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReject = async () => {
        if (!post || !rejectReason.trim()) return
        try {
            setSubmitting(true)
            await adminService.rejectPost(post.id, rejectReason)
            navigate('/dashboard/admin/posts/pending', { state: { message: 'Post rejected' } })
        } catch (err) {
            console.error('Failed to reject:', err)
            alert('Failed to reject post')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDisapprove = async () => {
        if (!post) return
        try {
            setSubmitting(true)
            await adminService.updatePostStatus(post.id, 'pending')
            navigate('/dashboard/admin/posts/pending', { state: { message: 'Post disapproved (moved to pending)' } })
        } catch (err) {
            console.error('Failed to disapprove:', err)
            alert('Failed to disapprove post')
        } finally {
            setSubmitting(false)
        }
    }

    // Helper to parse content safely
    const getPostContent = (): OutputData | null => {
        if (!post) return null
        try {
            return typeof post.content === 'string' ? JSON.parse(post.content) : post.content
        } catch {
            return null
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading post details...</div>
    if (error || !post) return <div className="p-8 text-center text-red-500">{error || 'Post not found'}</div>

    const contentData = getPostContent()

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Review Post</h1>
                    <p className="text-gray-500 text-sm mt-1">Review content and manage visibility before publishing</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/dashboard/admin/posts/pending')}>
                    Back to List
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Post Content & Groups */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Post Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center text-navy font-bold">
                                    {post.author.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{post.author.name}</p>
                                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${post.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {post.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="p-8 min-h-[400px]">
                            {post.title && <h1 className="text-3xl font-bold text-gray-900 mb-6">{post.title}</h1>}
                            {contentData ? (
                                <PostRenderer content={contentData} />
                            ) : (
                                <div className="prose max-w-none">{post.content}</div>
                            )}
                        </div>
                    </div>

                    {/* Groups Selection - Now below post */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <GroupSelector
                            selectedGroups={selectedGroups}
                            onChange={handleGroupSelectionChange}
                        />
                    </div>
                </div>

                {/* Right Column: Actions Only */}
                <div className="space-y-6">
                    {/* Action Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Review Decision</h3>

                        {status === 'review' ? (
                            <div className="space-y-3">
                                <Button
                                    variant="success"
                                    className="w-full justify-center"
                                    size="lg"
                                    onClick={handleApprove}
                                    loading={submitting}
                                >
                                    Approve & Publish
                                </Button>
                                <Button
                                    variant="danger"
                                    className="w-full justify-center"
                                    onClick={() => setStatus('rejecting')}
                                    disabled={submitting}
                                >
                                    Reject
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-center"
                                    onClick={handleDisapprove}
                                    disabled={submitting}
                                >
                                    Disapprove
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                                        rows={3}
                                        placeholder="Why is this post being rejected?"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStatus('review')}
                                        disabled={submitting}
                                        className="justify-center"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={handleReject}
                                        loading={submitting}
                                        disabled={!rejectReason.trim()}
                                        className="justify-center"
                                    >
                                        Confirm
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
