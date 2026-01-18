import { useState } from 'react'
import { adminService, type UserItem } from '../../services/adminService'
import { Pagination, SearchFilter, Button, Avatar, Modal } from '../../components/common'
import { SortableHeader } from '../../components/tables'
import { GroupSelector } from '../../components/shared/GroupSelector'
import { useAdminTable, useCrudModal, useDeleteConfirm } from '../../hooks'
import { getAvatarColor } from '../../utils'

// ===== Types =====
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

// ===== User Form Component =====
function UserForm({
    formData,
    setFormData,
    mode
}: {
    formData: UserFormData
    setFormData: React.Dispatch<React.SetStateAction<UserFormData>>
    mode: 'create' | 'edit'
}) {
    return (
        <div className="space-y-4">
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

            {mode === 'create' && (
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

            {mode === 'edit' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none bg-white"
                    >
                        <option value="pending">Pending</option>
                        {formData.status === 'approved' && (
                            <option value="approved">Approved (current)</option>
                        )}
                        {formData.status === 'rejected' && (
                            <option value="rejected">Rejected (current)</option>
                        )}
                    </select>
                </div>
            )}
        </div>
    )
}

// ===== User Detail Row Component =====
function UserDetailRow({ user, onEdit, onDelete }: {
    user: UserItem
    onEdit: () => void
    onDelete: () => void
}) {
    return (
        <tr className="bg-gray-50/80 border-t border-gray-100">
            <td className="px-6 py-4" />
            <td colSpan={4} className="px-6 py-4">
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
                            <p>
                                <span className="text-gray-500">Status:</span>{' '}
                                <span className={`capitalize font-medium ${user.status === 'approved' ? 'text-green-700' :
                                    user.status === 'rejected' ? 'text-red-700' : 'text-amber-700'
                                    }`}>{user.status}</span>
                            </p>
                            <p><span className="text-gray-500">Joined:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h4>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={onEdit}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={onDelete}>Delete</Button>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    )
}

// ===== Main Component =====
export function AllUsers() {
    // Local state
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Groups modal state
    const [groupsModal, setGroupsModal] = useState<{
        isOpen: boolean
        userId: string | null
        userName: string
        selectedGroups: { id: string; name: string }[]
        saving: boolean
    }>({ isOpen: false, userId: null, userName: '', selectedGroups: [], saving: false })

    // Use the new hooks
    const table = useAdminTable<UserItem>({
        fetchData: (page, limit, search) => adminService.getAllUsers(page, limit, undefined, search),
        defaultSort: { field: 'createdAt', direction: 'desc' }
    })

    const modal = useCrudModal<UserFormData>({
        initialData: initialFormData,
        onCreate: async (data) => {
            await adminService.createUser({
                name: data.name,
                mobileNumber: data.mobileNumber,
                email: data.email,
                role: data.role
            })
        },
        onUpdate: async (id, data) => {
            await adminService.updateUser(id, {
                name: data.name,
                email: data.email,
                role: data.role,
                status: data.status
            })
        },
        onSuccess: table.refresh
    })

    const deleteConfirm = useDeleteConfirm()

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${table.selectedCount} users?`)) return
        try {
            await Promise.all(Array.from(table.selectedIds).map(id => adminService.deleteUser(id)))
            table.refresh()
        } catch {
            // Error handled by table hook
        }
    }

    const handleEditUser = (user: UserItem) => {
        modal.openEdit(user.id, {
            name: user.name,
            mobileNumber: user.mobileNumber,
            email: user.email || '',
            role: user.role,
            status: user.status
        })
    }

    // Groups modal handlers
    const openGroupsModal = async (user: UserItem) => {
        setGroupsModal({
            isOpen: true,
            userId: user.id,
            userName: user.name,
            selectedGroups: [],
            saving: false
        })

        try {
            // Fetch groups this user already belongs to
            const currentGroups = await adminService.getUserGroups(user.id)
            setGroupsModal(prev => ({
                ...prev,
                selectedGroups: currentGroups.map(g => ({ id: g.id, name: g.name }))
            }))
        } catch (err) {
            console.error('Failed to fetch user groups:', err)
        }
    }

    const closeGroupsModal = () => {
        setGroupsModal({ isOpen: false, userId: null, userName: '', selectedGroups: [], saving: false })
    }

    const handleGroupsChange = (groups: { id: string; name: string }[]) => {
        setGroupsModal(prev => ({ ...prev, selectedGroups: groups }))
    }

    const saveGroupsSelection = async () => {
        if (!groupsModal.userId || groupsModal.selectedGroups.length === 0) return

        setGroupsModal(prev => ({ ...prev, saving: true }))
        try {
            await adminService.addUserToGroups(groupsModal.userId, groupsModal.selectedGroups.map(g => g.id))
            closeGroupsModal()
        } catch (err) {
            console.error('Failed to add user to groups:', err)
            alert('Failed to add user to groups')
        } finally {
            setGroupsModal(prev => ({ ...prev, saving: false }))
        }
    }

    const sortedUsers = table.getSortedItems()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-bold text-navy">Users</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage all registered users</p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchFilter
                        value={table.search}
                        onChange={table.setSearch}
                        placeholder="Search users..."
                    />
                    <Button
                        onClick={modal.openCreate}
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

            {/* Error */}
            {table.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {table.error}
                    <Button onClick={table.refresh} variant="ghost" className="ml-4 underline">Retry</Button>
                </div>
            )}

            {/* Bulk Actions */}
            {table.selectedCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-amber-800 font-medium">{table.selectedCount} users selected</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={table.clearSelection} className="text-amber-700">
                            Clear Selection
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 w-4">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-navy focus:ring-navy w-4 h-4"
                                        checked={table.isAllSelected && sortedUsers.length > 0}
                                        onChange={table.selectAll}
                                    />
                                </th>
                                <SortableHeader label="Name" field="name" currentField={table.sortField} direction={table.sortDirection} onSort={table.handleSort} />
                                <SortableHeader label="Phone / Email" field="mobileNumber" currentField={table.sortField} direction={table.sortDirection} onSort={table.handleSort} />
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {table.loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-4" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                    </tr>
                                ))
                            ) : sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                        {table.search ? 'No users match your search' : 'No users found'}
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => (
                                    <>
                                        <tr
                                            key={user.id}
                                            className={`transition-all cursor-pointer border-l-4 ${user.status === 'approved' ? 'bg-green-50/50 border-green-500 hover:bg-green-100/50' :
                                                user.status === 'rejected' ? 'bg-red-50/50 border-red-500 hover:bg-red-100/50' :
                                                    'bg-amber-50/50 border-amber-500 hover:bg-amber-100/50'
                                                }`}
                                            onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                                        >
                                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-navy focus:ring-navy w-4 h-4"
                                                    checked={table.isSelected(user.id)}
                                                    onChange={() => table.toggleSelect(user.id)}
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
                                                    <span className="font-medium text-gray-900">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="font-mono text-gray-800">{user.mobileNumber}</p>
                                                    {user.email && <p className="text-gray-500">{user.email}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${user.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    user.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="success" onClick={() => openGroupsModal(user)}>
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        Groups
                                                    </Button>
                                                    <Button size="sm" variant="primary" onClick={() => handleEditUser(user)}>
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        Edit
                                                    </Button>
                                                    <Button size="sm" variant="danger" onClick={() => deleteConfirm.requestDelete(user.id)}>
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === user.id && (
                                            <UserDetailRow
                                                key={`${user.id}-detail`}
                                                user={user}
                                                onEdit={() => handleEditUser(user)}
                                                onDelete={() => deleteConfirm.requestDelete(user.id)}
                                            />
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={table.page}
                totalPages={table.totalPages}
                totalItems={table.totalItems}
                itemsPerPage={table.itemsPerPage}
                onPageChange={table.setPage}
                onItemsPerPageChange={table.setItemsPerPage}
            />

            {/* Create/Edit Modal */}
            <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.mode === 'create' ? 'Register New User' : 'Edit User'}>
                <form onSubmit={(e) => { e.preventDefault(); modal.submit() }} className="space-y-4">
                    {modal.error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                            {modal.error}
                        </div>
                    )}
                    <UserForm formData={modal.formData} setFormData={modal.setFormData} mode={modal.mode} />
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={modal.close} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={modal.submitting} className="flex-1">
                            {modal.mode === 'create' ? 'Create User' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteConfirm.confirmingId !== null} onClose={deleteConfirm.cancelDelete} title="Delete User?">
                <p className="text-gray-600 mb-6">This will permanently remove the user account. This action cannot be undone.</p>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={deleteConfirm.cancelDelete} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => deleteConfirm.confirmDelete(async (id) => {
                            await adminService.deleteUser(id)
                            table.refresh()
                        })}
                        loading={deleteConfirm.deleting}
                        className="flex-1"
                    >
                        Delete
                    </Button>
                </div>
            </Modal>

            {/* Groups Selection Modal */}
            <Modal
                isOpen={groupsModal.isOpen}
                onClose={closeGroupsModal}
                title={`Add ${groupsModal.userName} to Groups`}
                size="2xl"
            >
                <div className="space-y-4">
                    <GroupSelector
                        selectedGroups={groupsModal.selectedGroups}
                        onChange={handleGroupsChange}
                    />

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button variant="outline" onClick={closeGroupsModal} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            variant="success"
                            onClick={saveGroupsSelection}
                            loading={groupsModal.saving}
                            disabled={groupsModal.selectedGroups.length === 0}
                            className="flex-1"
                        >
                            Add to {groupsModal.selectedGroups.length} Group{groupsModal.selectedGroups.length !== 1 ? 's' : ''}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default AllUsers
