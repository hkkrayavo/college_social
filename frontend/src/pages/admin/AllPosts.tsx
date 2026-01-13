import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService, type PostItem } from '../../services/adminService'
import { Pagination, SearchFilter, StatusBadge, Avatar } from '../../components/common'

type SortField = 'title' | 'author' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const getAvatarColor = (name: string) => {
    const colors = [
        'bg-blue-600',
        'bg-indigo-600',
        'bg-purple-600',
        'bg-pink-600',
        'bg-rose-600',
        'bg-amber-600',
        'bg-emerald-600',
        'bg-cyan-600',
        'bg-teal-600'
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
}

export function AllPosts() {
    const navigate = useNavigate()
    const [posts, setPosts] = useState<PostItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('createdAt')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Disapprove confirmation
    const [disapproveConfirm, setDisapproveConfirm] = useState<string | null>(null)
    const [unapproving, setUnapproving] = useState(false)

    const loadPosts = useCallback(async () => {
        try {
            setLoading(true)
            const response = await adminService.getAllPosts(page, itemsPerPage, statusFilter !== 'all' ? statusFilter : undefined)
            setPosts(response.data)
            setTotalPages(response.pagination?.totalPages || 1)
            setTotalItems(response.pagination?.total || 0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load posts')
        } finally {
            setLoading(false)
        }
    }, [page, itemsPerPage, statusFilter])

    useEffect(() => {
        loadPosts()
    }, [loadPosts])

    useEffect(() => {
        setSelectedIds(new Set())
    }, [posts])

    const handleItemsPerPageChange = (perPage: number) => {
        setItemsPerPage(perPage)
        setPage(1)
    }

    // Sorting handler
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Sort icon component
    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return (
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            )
        }
        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        )
    }

    // Selection handlers
    const handleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedPosts.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAndSortedPosts.map(p => p.id)))
        }
    }

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const getPostTitle = (post: PostItem): string => {
        if (post.title) return post.title
        try {
            const data = JSON.parse(post.content)
            const firstHeader = data.blocks?.find((b: { type: string }) => b.type === 'header')
            if (firstHeader?.data?.text) {
                return firstHeader.data.text.replace(/<[^>]*>/g, '').slice(0, 60) + (firstHeader.data.text.length > 60 ? '...' : '')
            }
            const firstPara = data.blocks?.find((b: { type: string }) => b.type === 'paragraph')
            if (firstPara?.data?.text) {
                return firstPara.data.text.replace(/<[^>]*>/g, '').slice(0, 60) + (firstPara.data.text.length > 60 ? '...' : '')
            }
        } catch { }
        return 'Untitled Post'
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }



    // Delete handler
    const handleDelete = async (postId: string) => {
        setDeleting(true)
        try {
            await adminService.rejectPost(postId, 'Deleted by admin')
            setDeleteConfirm(null)
            loadPosts()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete post')
        } finally {
            setDeleting(false)
        }
    }

    const handleDisapprove = async (postId: string) => {
        setUnapproving(true)
        try {
            await adminService.updatePostStatus(postId, 'pending', 'Disapproved by admin')
            setDisapproveConfirm(null)
            loadPosts()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to disapprove post')
        } finally {
            setUnapproving(false)
        }
    }

    // Bulk delete handler
    const handleBulkDelete = async () => {
        setDeleting(true)
        try {
            const idsToDelete = Array.from(selectedIds)
            await Promise.all(idsToDelete.map(id => adminService.deletePost(id)))
            setBulkDeleteConfirm(false)
            setSelectedIds(new Set())
            loadPosts()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete posts')
        } finally {
            setDeleting(false)
        }
    }

    // Filter and sort posts
    const filteredAndSortedPosts = posts
        .filter(post =>
            post.content.toLowerCase().includes(search.toLowerCase()) ||
            post.author.name.toLowerCase().includes(search.toLowerCase()) ||
            (post.title && post.title.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            let comparison = 0
            if (sortField === 'author') {
                comparison = a.author.name.localeCompare(b.author.name)
            } else if (sortField === 'title') {
                comparison = getPostTitle(a).localeCompare(getPostTitle(b))
            } else if (sortField === 'status') {
                comparison = a.status.localeCompare(b.status)
            } else if (sortField === 'createdAt') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            }
            return sortDirection === 'asc' ? comparison : -comparison
        })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy">All Posts</h1>
                    <p className="text-gray-500 text-sm mt-0.5">View and manage all user posts</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <SearchFilter
                        value={search}
                        onChange={setSearch}
                        placeholder="Search posts or authors..."
                    />
                </div>
            </div>

            {/* Selection Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
                    <span className="text-amber-800 font-medium">{selectedIds.size} posts selected</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="px-3 py-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded transition-colors"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={() => setBulkDeleteConfirm(true)}
                            className="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-sm"
                        >
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                    <button onClick={loadPosts} className="ml-4 underline">Retry</button>
                </div>
            )}

            {/* Enhanced Posts Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                {/* Checkbox Column */}
                                <th className="w-12 px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={filteredAndSortedPosts.length > 0 && selectedIds.size === filteredAndSortedPosts.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                    />
                                </th>
                                <th
                                    onClick={() => handleSort('author')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Author
                                        <SortIcon field="author" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('title')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Title / Preview
                                        <SortIcon field="title" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('status')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Status
                                        <SortIcon field="status" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('createdAt')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Date
                                        <SortIcon field="createdAt" />
                                    </div>
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                // Loading skeleton
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-gray-200 rounded-full" />
                                                <div className="h-4 bg-gray-200 rounded w-24" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-20" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-20" /></td>
                                    </tr>
                                ))
                            ) : filteredAndSortedPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="text-gray-400">
                                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium">{search ? 'No posts match your search' : 'No posts found'}</p>
                                            <p className="text-sm mt-1">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedPosts.map((post, index) => (
                                    <tr
                                        key={post.id}
                                        className={`
                                            transition-all duration-150
                                            ${selectedIds.has(post.id) ? 'bg-navy/5' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                            hover:bg-navy/10
                                        `}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(post.id)}
                                                onChange={() => handleSelectRow(post.id)}
                                                className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={post.author.profilePictureUrl}
                                                    name={post.author.name || 'User'}
                                                    size="sm"
                                                    className={getAvatarColor(post.author.name || 'User')}
                                                    fallbackClassName="text-white font-bold text-sm shadow-md border-2 border-white"
                                                />
                                                <span className="font-medium text-gray-800 text-sm">{post.author.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <span
                                                className="text-gray-700 text-sm cursor-pointer hover:text-navy truncate block"
                                                onClick={() => navigate(`/dashboard/posts/${post.id}`)}
                                            >
                                                {getPostTitle(post)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={post.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {formatDate(post.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/dashboard/posts/${post.id}`)}
                                                    className="p-2 text-gray-500 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors"
                                                    title="View post"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                {post.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={async () => {
                                                                await adminService.approvePost(post.id)
                                                                loadPosts()
                                                            }}
                                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                await adminService.rejectPost(post.id)
                                                                loadPosts()
                                                            }}
                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                                {post.status === 'approved' && (
                                                    <button
                                                        onClick={() => setDisapproveConfirm(post.id)}
                                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Disapprove"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {post.status === 'rejected' && (
                                                    <>
                                                        <button
                                                            onClick={async () => {
                                                                await adminService.updatePostStatus(post.id, 'pending')
                                                                loadPosts()
                                                            }}
                                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Restore to Pending"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                await adminService.approvePost(post.id)
                                                                loadPosts()
                                                            }}
                                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setDeleteConfirm(post.id)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete post"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setPage}
                onItemsPerPageChange={handleItemsPerPageChange}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Post?</h3>
                        <p className="text-gray-600 mb-6">This action cannot be undone. Are you sure you want to delete this post?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Disapprove Confirmation Modal */}
            {disapproveConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Disapprove Post?</h3>
                        <p className="text-gray-600 mb-6">This will move the post back to the <strong>Pending</strong> status, requiring moderation again.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDisapproveConfirm(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDisapprove(disapproveConfirm)}
                                disabled={unapproving}
                                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                {unapproving ? 'Unapproving...' : 'Disapprove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {bulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete {selectedIds.size} Posts?</h3>
                        <p className="text-gray-600 mb-6">This action cannot be undone. Are you sure you want to delete the selected posts?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setBulkDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AllPosts
