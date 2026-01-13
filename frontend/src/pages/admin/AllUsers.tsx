import { useState, useEffect, useCallback } from 'react'
import { adminService, type UserItem } from '../../services/adminService'
import { Pagination, SearchFilter, Button, Avatar } from '../../components/common'

interface UserFormData {
    name: string
    mobileNumber: string
    email: string
    role: string
    status: string
}


const initialFormData: UserFormData = {
    name: '',
    mobileNumber: '',
    email: '',
    role: 'user',
    status: 'approved'
}

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

export function AllUsers() {
    const [users, setUsers] = useState<UserItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [search, setSearch] = useState('')

    // Sidebar/Sorting state
    const [sortField, setSortField] = useState<SortField>('createdAt')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [formData, setFormData] = useState<UserFormData>(initialFormData)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Expanded row state
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Selection state
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUsers(users.map(u => u.id))
        } else {
            setSelectedUsers([])
        }
    }

    const handleSelectUser = (id: string) => {
        setSelectedUsers(prev => {
            if (prev.includes(id)) {
                return prev.filter(userId => userId !== id)
            } else {
                return [...prev, id]
            }
        })
    }

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return
        setDeleting(true)
        try {
            await Promise.all(selectedUsers.map(id => adminService.deleteUser(id)))
            setSelectedUsers([])
            loadUsers()
        } catch (err) {
            setError('Failed to delete some users')
        } finally {
            setDeleting(false)
        }
    }

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true)
            const response = await adminService.getAllUsers(page, itemsPerPage, undefined, search)
            setUsers(response.data)
            setTotalPages(response.pagination?.totalPages || 1)
            setTotalItems(response.pagination?.total || 0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }, [page, itemsPerPage, search])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    const handleItemsPerPageChange = (perPage: number) => {
        setItemsPerPage(perPage)
        setPage(1)
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

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

    // Modal Handlers
    const handleCreateUser = () => {
        setFormData(initialFormData)
        setEditingUserId(null)
        setModalMode('create')
        setFormError(null)
        setShowModal(true)
    }

    const handleEditUser = (user: UserItem) => {
        setFormData({
            name: user.name,
            mobileNumber: user.mobileNumber,
            email: user.email || '',
            role: user.role,
            status: user.status
        })
        setEditingUserId(user.id)
        setModalMode('edit')
        setFormError(null)
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        setSubmitting(true)

        try {
            if (modalMode === 'create') {
                await adminService.createUser({
                    name: formData.name,
                    mobileNumber: formData.mobileNumber,
                    email: formData.email,
                    role: formData.role
                })
            } else if (editingUserId) {
                await adminService.updateUser(editingUserId, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    status: formData.status
                })
            }
            setShowModal(false)
            loadUsers()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Operation failed')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (userId: string) => {
        setDeleting(true)
        try {
            await adminService.deleteUser(userId)
            setDeleteConfirm(null)
            loadUsers()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy">Users</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage all registered users</p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchFilter
                        value={search}
                        onChange={setSearch}
                        placeholder="Search users..."
                    />
                    <Button
                        onClick={handleCreateUser}
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Create User
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                    <Button onClick={loadUsers} variant="ghost" className="ml-4 underline text-red-700 hover:text-red-800 hover:bg-red-100 p-0 h-auto">Retry</Button>
                </div>
            )}

            {/* Users Table */}
            {selectedUsers.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-amber-800 font-medium">{selectedUsers.length} users selected</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedUsers([])} className="text-amber-700 hover:text-amber-900 hover:bg-amber-100">
                            Clear Selection
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleBulkDelete} loading={deleting}>
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 w-4">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-navy focus:ring-navy w-4 h-4 cursor-pointer"
                                        checked={users.length > 0 && selectedUsers.length === users.length}
                                        onChange={handleSelectAll}
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
                                        Phone / Email
                                        <SortIcon field="mobileNumber" />
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
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="text-gray-400">
                                            <p className="text-lg font-medium">{search ? 'No users match your search' : 'No users found'}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <>
                                        <tr
                                            key={user.id}
                                            className={`
                                                transition-all duration-150 cursor-pointer
                                                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                                hover:bg-navy/5
                                            `}
                                            onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                                        >
                                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-navy focus:ring-navy w-4 h-4 cursor-pointer"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleSelectUser(user.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={user.profilePictureUrl}
                                                        name={user.name || 'User'}
                                                        size="md"
                                                        fallbackClassName={`${getAvatarColor(user.name || 'User')} text-white border-2 border-white`}
                                                    />
                                                    <div>
                                                        <div className="font-medium text-gray-800 text-sm">{user.name || 'Unknown User'}</div>
                                                        <div className="text-xs text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-mono">{user.mobileNumber}</div>
                                                <div className="text-xs text-gray-500">{user.email || 'No email'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize px-2.5 py-1 bg-navy/10 text-navy rounded-full text-xs font-medium">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="p-2 text-gray-500 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(user.id)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete user"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === user.id && (
                                            <tr key={`${user.id}-details`} className="bg-gray-50 border-l-4 border-indigo-500">
                                                <td className="px-6"></td>
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Personal Information</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <p><span className="text-gray-500">Full Name:</span> <span className="font-medium">{user.name}</span></p>
                                                                <p><span className="text-gray-500">Mobile:</span> <span className="font-mono">{user.mobileNumber}</span></p>
                                                                <p><span className="text-gray-500">Email:</span> {user.email || '—'}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Account Details</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <p><span className="text-gray-500">Role:</span> <span className="capitalize">{user.role}</span></p>
                                                                <p><span className="text-gray-500">Status:</span> <span className={`capitalize font-medium ${user.status === 'approved' ? 'text-green-700' :
                                                                    user.status === 'rejected' ? 'text-red-700' : 'text-amber-700'
                                                                    }`}>{user.status}</span></p>
                                                                <p><span className="text-gray-500">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h4>
                                                            <div className="flex flex-col gap-2">
                                                                <Button size="sm" onClick={() => handleEditUser(user)} className="w-full justify-center">Edit Details</Button>
                                                                <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(user.id)} className="w-full justify-center">Delete User</Button>
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-navy">
                                {modalMode === 'create' ? 'Register New User' : 'Edit User'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                />
                            </div>

                            {modalMode === 'create' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.mobileNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none bg-white"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {modalMode === 'edit' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none bg-white"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={submitting}
                                    className="flex-1"
                                >
                                    {modalMode === 'create' ? 'Create User' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete User?</h3>
                        <p className="text-gray-600 mb-6">This will permanently remove the user account. This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleDelete(deleteConfirm)}
                                loading={deleting}
                                className="flex-1"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AllUsers
