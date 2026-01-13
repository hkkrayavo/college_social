import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { adminService, type GroupType } from '../../services/adminService'
import { SearchFilter, Button } from '../../components/common'

interface TypeFormData {
    label: string
    description: string
}

const initialFormData: TypeFormData = {
    label: '',
    description: ''
}

type SortField = 'label' | 'description'
type SortDirection = 'asc' | 'desc'

export function AdminGroupTypes() {
    const [groupTypes, setGroupTypes] = useState<GroupType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('label')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [formData, setFormData] = useState<TypeFormData>(initialFormData)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const loadGroupTypes = useCallback(async () => {
        try {
            setLoading(true)
            const response = await adminService.getGroupTypes()
            setGroupTypes(response.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load group types')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadGroupTypes()
    }, [loadGroupTypes])

    useEffect(() => {
        setSelectedIds(new Set())
    }, [groupTypes])

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
        if (selectedIds.size === filteredAndSortedTypes.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredAndSortedTypes.map(t => t.id)))
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
    const handleCreateType = () => {
        setFormData(initialFormData)
        setEditingId(null)
        setModalMode('create')
        setFormError(null)
        setShowModal(true)
    }

    // Open edit modal
    const handleEditType = (type: GroupType) => {
        setFormData({
            label: type.label,
            description: type.description || ''
        })
        setEditingId(type.id)
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
                await adminService.createGroupType(formData)
            } else if (editingId) {
                await adminService.updateGroupType(editingId, formData)
            }
            setShowModal(false)
            loadGroupTypes()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Operation failed')
        } finally {
            setSubmitting(false)
        }
    }

    // Handle delete
    const handleDelete = async (id: string) => {
        setDeleting(true)
        setDeleteError(null)
        try {
            await adminService.deleteGroupType(id)
            setDeleteConfirm(null)
            loadGroupTypes()
        } catch (err: any) {
            // Extract error message from API response (backend uses 'error' field)
            const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to delete. Type may be in use.'
            setDeleteError(message)
        } finally {
            setDeleting(false)
        }
    }

    // Filter and sort types
    const filteredAndSortedTypes = groupTypes
        .filter(type =>
            type.label.toLowerCase().includes(search.toLowerCase()) ||
            (type.description && type.description.toLowerCase().includes(search.toLowerCase()))
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
                    <div className="flex items-center gap-3">
                        <Link
                            to="/dashboard/admin/groups"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Back to Groups"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-navy">Group Types</h1>
                            <p className="text-gray-500 text-sm mt-0.5">Define categories for organizing groups</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <SearchFilter
                        value={search}
                        onChange={setSearch}
                        placeholder="Search types..."
                    />
                    <Button
                        onClick={handleCreateType}
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Create Type
                    </Button>
                </div>
            </div>

            {/* Selection Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-navy/5 border border-navy/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-navy font-medium">
                        {selectedIds.size} type{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear Selection
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
                </div>
            )}

            {/* Group Types Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                {/* Checkbox Column */}
                                <th className="w-12 px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={filteredAndSortedTypes.length > 0 && selectedIds.size === filteredAndSortedTypes.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                    />
                                </th>
                                <th
                                    onClick={() => handleSort('label')}
                                    className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-2">
                                        Label
                                        <SortIcon field="label" />
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
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                                    </tr>
                                ))
                            ) : filteredAndSortedTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="text-gray-400">
                                            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <p className="text-lg font-medium">{search ? 'No types match your search' : 'No group types created yet'}</p>
                                            <p className="text-sm mt-1">Create your first type to categorize groups</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedTypes.map((type, index) => (
                                    <tr
                                        key={type.id}
                                        className={`
                                            transition-all duration-150
                                            ${selectedIds.has(type.id) ? 'bg-navy/5' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                            hover:bg-navy/10
                                        `}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(type.id)}
                                                onChange={() => handleSelectRow(type.id)}
                                                className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 ${getAvatarColor(type.label)} rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-sm`}>
                                                    {type.label.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-800 text-sm">{type.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm max-w-xs">
                                            <span className="line-clamp-1">{type.description || <span className="text-gray-400">—</span>}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditType(type)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => setDeleteConfirm(type.id)}
                                                >
                                                    Delete
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-navy">
                                {modalMode === 'create' ? 'Create Group Type' : 'Edit Group Type'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{formError}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.label}
                                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                                    placeholder="e.g., Department, Club, Sports"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
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
                                    {modalMode === 'create' ? 'Create Type' : 'Save Changes'}
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
                        <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Group Type?</h3>
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to delete "<span className="font-medium">{groupTypes.find(t => t.id === deleteConfirm)?.label}</span>"?
                                This action cannot be undone.
                            </p>
                            {deleteError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {deleteError}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => { setDeleteConfirm(null); setDeleteError(null) }}
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

export default AdminGroupTypes
