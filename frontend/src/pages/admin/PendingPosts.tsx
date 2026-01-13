import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService, type PostItem } from '../../services/adminService'
import { Pagination, SearchFilter, Button, Avatar } from '../../components/common'

type SortField = 'title' | 'author' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export function PendingPosts() {
    const navigate = useNavigate()
    const [posts, setPosts] = useState<PostItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [search, setSearch] = useState('')

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('createdAt')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const loadPosts = useCallback(async () => {
        try {
            setLoading(true)
            const response = await adminService.getPendingPosts(page, itemsPerPage)
            setPosts(response.data)
            setTotalPages(response.pagination?.totalPages || 1)
            setTotalItems(response.pagination?.total || 0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load posts')
        } finally {
            setLoading(false)
        }
    }, [page, itemsPerPage])

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

    const handleSelectRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
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
            hour: '2-digit',
            minute: '2-digit',
        })
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
            } else if (sortField === 'createdAt') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            }
            return sortDirection === 'asc' ? comparison : -comparison
        })

    // Bulk actions
    const handleBulkApprove = async () => {
        for (const id of selectedIds) {
            try {
                await adminService.approvePost(id)
            } catch (err) {
                console.error('Failed to approve post:', id)
            }
        }
        setSelectedIds(new Set())
        loadPosts()
    }

    const handleBulkReject = async () => {
        for (const id of selectedIds) {
            try {
                await adminService.rejectPost(id)
            } catch (err) {
                console.error('Failed to reject post:', id)
            }
        }
        setSelectedIds(new Set())
        loadPosts()
    }

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy">Pending Posts</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Review and moderate user posts</p>
                </div>
                <SearchFilter
                    value={search}
                    onChange={setSearch}
                    placeholder="Search posts or authors..."
                />
            </div>

            {/* Selection Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-navy/5 border border-navy/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-navy font-medium">
                        {selectedIds.size} post{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleBulkApprove}
                        >
                            Approve All
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleBulkReject}
                        >
                            Reject All
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                    <Button onClick={loadPosts} variant="ghost" className="ml-4 underline text-red-700 hover:text-red-800 hover:bg-red-100 p-0 h-auto">Retry</Button>
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
                                    onClick={() => handleSort('createdAt')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Date
                                        <SortIcon field="createdAt" />
                                    </div>
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-32 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredAndSortedPosts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="text-gray-400">
                                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium">{search ? 'No posts match your search' : 'No posts pending approval'}</p>
                                            <p className="text-sm mt-1">Check back later or adjust your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedPosts.map((post, index) => (
                                    <tr
                                        key={post.id}
                                        onClick={() => navigate(`/dashboard/posts/${post.id}`)}
                                        className={`
                                            transition-all duration-150 cursor-pointer
                                            ${selectedIds.has(post.id) ? 'bg-navy/5' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                            hover:bg-navy/10
                                        `}
                                    >
                                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(post.id)}
                                                onChange={(e) => handleSelectRow(post.id, e as unknown as React.MouseEvent)}
                                                className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={post.author.profilePictureUrl}
                                                    name={post.author.name}
                                                    size="sm"
                                                    className={getAvatarColor(post.author.name)}
                                                    fallbackClassName="text-white font-medium text-sm shadow-sm"
                                                />
                                                <span className="font-medium text-gray-800 text-sm">{post.author.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700 text-sm">{getPostTitle(post)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(post.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="purple"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigate(`/dashboard/admin/posts/${post.id}/review`)
                                                    }}
                                                    className="flex items-center gap-1"
                                                    leftIcon={
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    }
                                                >
                                                    Review
                                                </Button>
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
        </div>
    )
}

export default PendingPosts
