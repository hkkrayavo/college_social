import { useState, useEffect, useCallback } from 'react'
import { adminService, type UserItem } from '../../services/adminService'
import { Pagination, SearchFilter, Button, Avatar } from '../../components/common'

type SortField = 'name' | 'mobileNumber' | 'email' | 'role' | 'createdAt'
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

export function PendingUsers() {
    const [users, setUsers] = useState<UserItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
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

    // Expanded row state
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true)
            const response = await adminService.getPendingUsers(page, itemsPerPage)
            setUsers(response.data)
            setTotalPages(response.pagination?.totalPages || 1)
            setTotalItems(response.pagination?.total || 0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }, [page, itemsPerPage])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    useEffect(() => {
        setSelectedIds(new Set())
    }, [users])

    const handleApprove = async (userId: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        try {
            setActionLoading(userId)
            await adminService.approveUser(userId)
            setUsers(users.filter(u => u.id !== userId))
            setTotalItems(prev => prev - 1)
        } catch (err) {
            alert('Failed to approve user')
        } finally {
            setActionLoading(null)
        }
    }

    const handleReject = async (userId: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        try {
            setActionLoading(userId)
            await adminService.rejectUser(userId)
            setUsers(users.filter(u => u.id !== userId))
            setTotalItems(prev => prev - 1)
        } catch (err) {
            alert('Failed to reject user')
        } finally {
            setActionLoading(null)
        }
    }

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
        if (selectedIds.size === filteredAndSortedUsers.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAndSortedUsers.map(u => u.id)))
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

    // Bulk actions
    const handleBulkApprove = async () => {
        for (const id of selectedIds) {
            try {
                await adminService.approveUser(id)
            } catch (err) {
                console.error('Failed to approve user:', id)
            }
        }
        setSelectedIds(new Set())
        loadUsers()
    }

    const handleBulkReject = async () => {
        for (const id of selectedIds) {
            try {
                await adminService.rejectUser(id)
            } catch (err) {
                console.error('Failed to reject user:', id)
            }
        }
        setSelectedIds(new Set())
        loadUsers()
    }

    // Filter and sort users
    const filteredAndSortedUsers = users
        .filter(user =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.mobileNumber.includes(search) ||
            (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            const aValue = a[sortField] || ''
            const bValue = b[sortField] || ''
            const comparison = String(aValue).localeCompare(String(bValue))
            return sortDirection === 'asc' ? comparison : -comparison
        })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy">Pending Users</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Approve or reject user registrations</p>
                </div>
                <SearchFilter
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name, phone, email..."
                />
            </div>

            {/* Selection Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
                    <span className="text-amber-800 font-medium">{selectedIds.size} users selected</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-amber-700 hover:text-amber-900 hover:bg-amber-100">
                            Clear Selection
                        </Button>
                        <Button size="sm" variant="success" onClick={handleBulkApprove}>
                            Approve Selected
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleBulkReject}>
                            Reject Selected
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                    <Button onClick={loadUsers} variant="ghost" className="ml-4 underline text-red-700 hover:text-red-800 hover:bg-red-100 p-0 h-auto">Retry</Button>
                </div>
            )
            }

            {/* Enhanced Users Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                {/* Checkbox Column */}
                                <th className="w-12 px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={filteredAndSortedUsers.length > 0 && selectedIds.size === filteredAndSortedUsers.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                    />
                                </th>
                                <th
                                    onClick={() => handleSort('name')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Name
                                        <SortIcon field="name" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('mobileNumber')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Phone
                                        <SortIcon field="mobileNumber" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('email')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Email
                                        <SortIcon field="email" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('role')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Role
                                        <SortIcon field="role" />
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
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-32 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredAndSortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="text-gray-400">
                                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                            <p className="text-lg font-medium">{search ? 'No users match your search' : 'No pending users'}</p>
                                            <p className="text-sm mt-1">All registrations have been processed</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedUsers.map((user, index) => (
                                    <>
                                        <tr
                                            key={user.id}
                                            className={`
                                            transition-all duration-150 cursor-pointer
                                            ${selectedIds.has(user.id) ? 'bg-navy/5' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                            hover:bg-navy/10
                                        `}
                                            onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                                        >
                                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(user.id)}
                                                    onChange={(e) => handleSelectRow(user.id, e as unknown as React.MouseEvent)}
                                                    className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={user.profilePictureUrl}
                                                        name={user.name || 'User'}
                                                        size="sm"
                                                        className={getAvatarColor(user.name || 'User')}
                                                        fallbackClassName="text-white font-bold text-sm shadow-md border-2 border-white"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-800 text-sm">{user.name}</span>
                                                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === user.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-sm">{user.mobileNumber}</td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{user.email || <span className="text-gray-400">—</span>}</td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize px-2.5 py-1 bg-navy/10 text-navy rounded-full text-xs font-medium">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        onClick={(e) => handleApprove(user.id, e)}
                                                        disabled={actionLoading === user.id}
                                                        variant="success"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        {actionLoading === user.id ? '...' : 'Approve'}
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => handleReject(user.id, e)}
                                                        disabled={actionLoading === user.id}
                                                        variant="danger"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Reject
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded Details Row */}
                                        {expandedId === user.id && (
                                            <tr key={`${user.id}-details`} className="bg-gray-50 border-l-4 border-amber-500">
                                                <td className="px-4"></td>
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Contact Information</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <p><span className="text-gray-500">Phone:</span> <span className="font-mono">{user.mobileNumber}</span></p>
                                                                <p><span className="text-gray-500">Email:</span> {user.email || <span className="text-gray-400">Not provided</span>}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Account Details</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <p><span className="text-gray-500">Role:</span> <span className="capitalize font-medium">{user.role}</span></p>
                                                                <p><span className="text-gray-500">Status:</span> <span className="text-amber-600 font-medium">Pending Approval</span></p>
                                                                <p><span className="text-gray-500">Requested:</span> {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h4>
                                                            <div className="flex flex-col gap-2">
                                                                <Button
                                                                    variant="success"
                                                                    onClick={(e) => handleApprove(user.id, e)}
                                                                    loading={actionLoading === user.id}
                                                                    className="w-full justify-center"
                                                                >
                                                                    Approve Request
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    onClick={(e) => handleReject(user.id, e)}
                                                                    disabled={actionLoading === user.id}
                                                                    className="w-full justify-center border-red-300"
                                                                >
                                                                    Reject Request
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
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
        </div >
    )
}

export default PendingUsers
