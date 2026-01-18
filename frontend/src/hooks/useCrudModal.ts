import { useState, useCallback } from 'react'

/**
 * Configuration options for useCrudModal hook
 */
export interface UseCrudModalOptions<T> {
    /** Initial form data for create mode */
    initialData: T

    /** Function to call when creating a new item */
    onCreate?: (data: T) => Promise<void>

    /** Function to call when updating an item */
    onUpdate?: (id: string, data: T) => Promise<void>

    /** Callback after successful create/update */
    onSuccess?: () => void
}

/**
 * Return type for useCrudModal hook
 */
export interface UseCrudModalReturn<T> {
    // Modal state
    isOpen: boolean
    mode: 'create' | 'edit'

    // Form state
    formData: T
    setFormData: React.Dispatch<React.SetStateAction<T>>
    updateField: <K extends keyof T>(field: K, value: T[K]) => void

    // Edit tracking
    editingId: string | null

    // Submission state
    submitting: boolean
    error: string | null

    // Actions
    openCreate: () => void
    openEdit: (id: string, data: T) => void
    close: () => void
    submit: () => Promise<void>
    reset: () => void
}

/**
 * Custom hook for managing CRUD modal state including form data,
 * submission state, and create/edit mode switching.
 * 
 * @example
 * ```tsx
 * const modal = useCrudModal({
 *     initialData: { name: '', email: '' },
 *     onCreate: async (data) => await api.createUser(data),
 *     onUpdate: async (id, data) => await api.updateUser(id, data),
 *     onSuccess: () => table.refresh()
 * })
 * 
 * return (
 *     <>
 *         <Button onClick={modal.openCreate}>Add User</Button>
 *         <Button onClick={() => modal.openEdit(user.id, user)}>Edit</Button>
 *         
 *         <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *             <form onSubmit={(e) => { e.preventDefault(); modal.submit() }}>
 *                 <input 
 *                     value={modal.formData.name}
 *                     onChange={(e) => modal.updateField('name', e.target.value)}
 *                 />
 *                 <Button type="submit" loading={modal.submitting}>
 *                     {modal.mode === 'create' ? 'Create' : 'Update'}
 *                 </Button>
 *             </form>
 *         </Modal>
 *     </>
 * )
 * ```
 */
export function useCrudModal<T extends object>(
    options: UseCrudModalOptions<T>
): UseCrudModalReturn<T> {
    const { initialData, onCreate, onUpdate, onSuccess } = options

    // Modal state
    const [isOpen, setIsOpen] = useState(false)
    const [mode, setMode] = useState<'create' | 'edit'>('create')

    // Form state
    const [formData, setFormData] = useState<T>(initialData)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Submission state
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Update a single field
    const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }, [])

    // Open modal for creating new item
    const openCreate = useCallback(() => {
        setFormData(initialData)
        setEditingId(null)
        setMode('create')
        setError(null)
        setIsOpen(true)
    }, [initialData])

    // Open modal for editing existing item
    const openEdit = useCallback((id: string, data: T) => {
        setFormData(data)
        setEditingId(id)
        setMode('edit')
        setError(null)
        setIsOpen(true)
    }, [])

    // Close modal
    const close = useCallback(() => {
        setIsOpen(false)
        setError(null)
    }, [])

    // Reset form to initial state
    const reset = useCallback(() => {
        setFormData(initialData)
        setEditingId(null)
        setMode('create')
        setError(null)
    }, [initialData])

    // Submit form
    const submit = useCallback(async () => {
        try {
            setSubmitting(true)
            setError(null)

            if (mode === 'create' && onCreate) {
                await onCreate(formData)
            } else if (mode === 'edit' && onUpdate && editingId) {
                await onUpdate(editingId, formData)
            }

            setIsOpen(false)
            setFormData(initialData)
            setEditingId(null)

            if (onSuccess) {
                onSuccess()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Operation failed')
        } finally {
            setSubmitting(false)
        }
    }, [mode, onCreate, onUpdate, formData, editingId, initialData, onSuccess])

    return {
        // Modal state
        isOpen,
        mode,

        // Form state
        formData,
        setFormData,
        updateField,

        // Edit tracking
        editingId,

        // Submission state
        submitting,
        error,

        // Actions
        openCreate,
        openEdit,
        close,
        submit,
        reset
    }
}
