import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminService, type GroupItem, type GroupType } from '../../services/adminService'
import { Pagination, SearchFilter, Button } from '../../components/common'

interface GroupFormData {
    name: string
    description: string
    groupTypeId?: string
}

const initialFormData: GroupFormData = {
    name: '',
    description: '',
    groupTypeId: ''
}

type SortField = 'name' | 'description' | 'type' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export function AdminGroups() {
    const navigate = useNavigate()
    const [groups, setGroups] = useState<GroupItem[]>([])
    const [groupTypes, setGroupTypes] = useState<GroupType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [search, setSearch] = useState('')

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [formData, setFormData] = useState<GroupFormData>(initialFormData)
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Expanded row state
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Group Type management state
    const [showTypeModal, setShowTypeModal] = useState(false)
    const [typeFormData, setTypeFormData] = useState<{ label: string; description: string }>({ label: '', description: '' })
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
    const [typeSubmitting, setTypeSubmitting] = useState(false)
    const [typeError, setTypeError] = useState<string | null>(null)
    const [deleteTypeConfirm, setDeleteTypeConfirm] = useState<string | null>(null)

    const loadGroups = useCallback(async () => {
        try {
            setLoading(true)
            const response = await adminService.getAllGroups(page, itemsPerPage)
            setGroups(response.data)
            setTotalPages(response.pagination?.totalPages || 1)
            setTotalItems(response.pagination?.total || 0)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load groups')
        } finally {
            setLoading(false)
        }
    }, [page, itemsPerPage])

    const loadGroupTypes = useCallback(async () => {
        try {
            const response = await adminService.getGroupTypes()
            setGroupTypes(response.data)
        } catch (err) {
            console.error('Failed to load group types:', err)
        }
    }, [])

    useEffect(() => {
        loadGroups()
        loadGroupTypes()
    }, [loadGroups, loadGroupTypes])

    useEffect(() => {
        setSelectedIds(new Set())
    }, [groups])

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
        if (selectedIds.size === filteredAndSortedGroups.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAndSortedGroups.map(g => g.id)))
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

    // Open create modal
    const handleCreateGroup = () => {
        setFormData(initialFormData)
        setEditingGroupId(null)
        setModalMode('create')
        setFormError(null)
        setShowModal(true)
    }

    // Open edit modal
    const handleEditGroup = (group: GroupItem) => {
        setFormData({
            name: group.name,
            description: group.description || ''
        })
        setEditingGroupId(group.id)
        setModalMode('edit')
        setFormError(null)
        setShowModal(true)
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        setSubmitting(true)

        try {
            if (modalMode === 'create') {
                // Create
                await adminService.createGroup({
                    name: formData.name,
                    description: formData.description,
                    groupTypeId: formData.groupTypeId // Send as groupTypeId
                })
            } else if (editingGroupId) {
                // Update
                await adminService.updateGroup(editingGroupId, {
                    name: formData.name,
                    description: formData.description,
                    // Note: Group update endpoint might need update to support typeId if desired
                    // For now we only support updating type on create or separate endpoint
                    // But let's check if we should send it.
                    groupTypeId: formData.groupTypeId // Include groupTypeId in update payload
                })
            }
            setShowModal(false)
            loadGroups()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Operation failed')
        } finally {
            setSubmitting(false)
        }
    }

    // Handle delete
    const handleDelete = async (groupId: string) => {
        setDeleting(true)
        try {
            await adminService.deleteGroup(groupId)
            setDeleteConfirm(null)
            loadGroups()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete group')
        } finally {
            setDeleting(false)
        }
    }

    // Group Type handlers
    const handleOpenTypeModal = (type?: GroupType) => {
        if (type) {
            setTypeFormData({ label: type.label, description: type.description || '' })
            setEditingTypeId(type.id)
        } else {
            setTypeFormData({ label: '', description: '' })
            setEditingTypeId(null)
        }
        setTypeError(null)
        setShowTypeModal(true)
    }

    const handleTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!typeFormData.label.trim()) {
            setTypeError('Label is required')
            return
        }
        setTypeSubmitting(true)
        setTypeError(null)
        try {
            if (editingTypeId) {
                await adminService.updateGroupType(editingTypeId, typeFormData)
            } else {
                await adminService.createGroupType(typeFormData)
            }
            setShowTypeModal(false)
            loadGroupTypes()
        } catch (err) {
            setTypeError(err instanceof Error ? err.message : 'Operation failed')
        } finally {
            setTypeSubmitting(false)
        }
    }

    const handleDeleteType = async (id: string) => {
        try {
            await adminService.deleteGroupType(id)
            setDeleteTypeConfirm(null)
            loadGroupTypes()
        } catch (err) {
            setTypeError(err instanceof Error ? err.message : 'Failed to delete. Type may be in use.')
        }
    }

    // Filter and sort groups
    const filteredAndSortedGroups = groups
        .filter(group =>
            group.name.toLowerCase().includes(search.toLowerCase()) ||
            (group.description && group.description.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            const aValue = a[sortField] || ''
            const bValue = b[sortField] || ''
            const comparison = String(aValue).localeCompare(String(bValue))
            return sortDirection === 'asc' ? comparison : -comparison
        })

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
                    <h1 className="text-xl font-bold text-navy">Groups</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage college groups and members</p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchFilter
                        value={search}
                        onChange={setSearch}
                        placeholder="Search groups..."
                    />
                    <Link
                        to="/dashboard/admin/groups/types"
                        className="btn-secondary flex items-center gap-2 px-4 py-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Manage Types
                    </Link>
                    <Button
                        onClick={handleCreateGroup}
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Create Group
                    </Button>
                </div>
            </div>

            {/* Selection Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-navy/5 border border-navy/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-navy font-medium">
                        {selectedIds.size} group{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear Selection
                        </Button>
                        <Button variant="danger" size="sm">
                            Delete Selected
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                    <button onClick={loadGroups} className="ml-4 underline">Retry</button>
                </div>
            )}

            {/* Enhanced Groups Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                {/* Checkbox Column */}
                                <th className="w-12 px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={filteredAndSortedGroups.length > 0 && selectedIds.size === filteredAndSortedGroups.length}
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
                                    onClick={() => handleSort('description')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Description
                                        <SortIcon field="description" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('type')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Type
                                        <SortIcon field="type" />
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
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                    </tr>
                                ))
                            ) : filteredAndSortedGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="text-gray-400">
                                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="text-lg font-medium">{search ? 'No groups match your search' : 'No groups created yet'}</p>
                                            <p className="text-sm mt-1">Create your first group to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedGroups.map((group, index) => (
                                    <>
                                        <tr
                                            key={group.id}
                                            className={`
                                            transition-all duration-150 cursor-pointer
                                            ${selectedIds.has(group.id) ? 'bg-navy/5' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                            hover:bg-navy/10
                                        `}
                                            onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                                        >
                                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(group.id)}
                                                    onChange={() => handleSelectRow(group.id)}
                                                    className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 ${getAvatarColor(group.name)} rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm`}>
                                                        {group.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-800 text-sm">{group.name}</span>
                                                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === group.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm max-w-xs">
                                                <span className="line-clamp-1">{group.description || <span className="text-gray-400">—</span>}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize px-2.5 py-1 bg-navy/10 text-navy rounded-full text-xs font-medium">
                                                    {group.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/dashboard/admin/groups/${group.id}/members`}
                                                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="View members"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleEditGroup(group)}
                                                        className="p-2 text-gray-500 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors"
                                                        title="Edit group"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(group.id)}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete group"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded Details Row */}
                                        {expandedId === group.id && (
                                            <tr key={`${group.id}-details`} className="bg-gray-50 border-l-4 border-green-500">
                                                <td className="px-4"></td>
                                                <td colSpan={4} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Group Information</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <p><span className="text-gray-500">Name:</span> <span className="font-medium">{group.name}</span></p>
                                                                <p><span className="text-gray-500">Type:</span> <span className="capitalize font-medium">{group.type}</span></p>
                                                                <p><span className="text-gray-500">Created:</span> {new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-1">
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h4>
                                                            <p className="text-sm text-gray-700">{group.description || <span className="text-gray-400 italic">No description provided</span>}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Actions</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button
                                                                    onClick={() => navigate(`/dashboard/admin/groups/${group.id}/members`)}
                                                                    variant="success"
                                                                    size="sm"
                                                                >
                                                                    View Members
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleEditGroup(group)}
                                                                    variant="primary"
                                                                    size="sm"
                                                                    className="bg-navy hover:bg-navy/90"
                                                                >
                                                                    Edit Group
                                                                </Button>
                                                                <Button
                                                                    onClick={() => setDeleteConfirm(group.id)}
                                                                    variant="danger"
                                                                    size="sm"
                                                                    className="border-red-300"
                                                                >
                                                                    Delete
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-navy">
                                {modalMode === 'create' ? 'Create New Group' : 'Edit Group'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
                                <select
                                    value={formData.groupTypeId || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, groupTypeId: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none bg-white"
                                >
                                    <option value="">Select a type (optional)</option>
                                    {groupTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                    placeholder="Enter group name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                                    placeholder="Optional description"
                                />
                            </div>

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
                                    {modalMode === 'create' ? 'Create Group' : 'Save Changes'}
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
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Group?</h3>
                        <p className="text-gray-600 mb-6">This will remove all members from the group. This action cannot be undone.</p>
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

            {/* Group Types Management Modal */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-navy">
                                {editingTypeId ? 'Edit Group Type' : 'Manage Group Types'}
                            </h2>
                            <button
                                onClick={() => { setShowTypeModal(false); setEditingTypeId(null) }}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            {typeError && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{typeError}</div>
                            )}

                            {/* Add/Edit Form */}
                            <form onSubmit={handleTypeSubmit} className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                                    <input
                                        type="text"
                                        value={typeFormData.label}
                                        onChange={(e) => setTypeFormData(prev => ({ ...prev, label: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy"
                                        placeholder="e.g., Department, Club, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={typeFormData.description}
                                        onChange={(e) => setTypeFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy"
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {editingTypeId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingTypeId(null)
                                                setTypeFormData({ label: '', description: '' })
                                            }}
                                        >
                                            Cancel Edit
                                        </Button>
                                    )}
                                    <Button type="submit" loading={typeSubmitting}>
                                        {editingTypeId ? 'Update Type' : 'Add Type'}
                                    </Button>
                                </div>
                            </form>

                            {/* Existing Types List */}
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-sm font-semibold text-gray-600 mb-3">Existing Group Types</h3>
                                {groupTypes.length === 0 ? (
                                    <p className="text-sm text-gray-500">No group types defined yet.</p>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {groupTypes.map(type => (
                                            <div key={type.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div>
                                                    <span className="font-medium text-gray-800">{type.label}</span>
                                                    {type.description && (
                                                        <span className="text-sm text-gray-500 ml-2">- {type.description}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleOpenTypeModal(type)}
                                                        className="p-1.5 text-gray-500 hover:text-navy hover:bg-gray-100 rounded"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    {deleteTypeConfirm === type.id ? (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleDeleteType(type.id)}
                                                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteTypeConfirm(null)}
                                                                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteTypeConfirm(type.id)}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminGroups
