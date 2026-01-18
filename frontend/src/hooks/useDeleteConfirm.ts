import { useState, useCallback } from 'react'

/**
 * Return type for useDeleteConfirm hook
 */
export interface UseDeleteConfirmReturn {
    /** ID of item pending deletion confirmation */
    confirmingId: string | null

    /** Whether deletion is in progress */
    deleting: boolean

    /** Error message if deletion failed */
    error: string | null

    /** Request deletion confirmation for an item */
    requestDelete: (id: string) => void

    /** Execute the deletion after confirmation */
    confirmDelete: (onDelete: (id: string) => Promise<void>) => Promise<void>

    /** Cancel the deletion */
    cancelDelete: () => void

    /** Check if a specific item is pending confirmation */
    isConfirming: (id: string) => boolean
}

/**
 * Custom hook for managing delete confirmation state.
 * Provides a two-step deletion process: request → confirm/cancel.
 * 
 * @example
 * ```tsx
 * const deleteConfirm = useDeleteConfirm()
 * 
 * return (
 *     <>
 *         {items.map(item => (
 *             <div key={item.id}>
 *                 {deleteConfirm.isConfirming(item.id) ? (
 *                     <>
 *                         <span>Are you sure?</span>
 *                         <Button 
 *                             onClick={() => deleteConfirm.confirmDelete(
 *                                 async (id) => await api.deleteItem(id)
 *                             )}
 *                             loading={deleteConfirm.deleting}
 *                         >
 *                             Yes, Delete
 *                         </Button>
 *                         <Button onClick={deleteConfirm.cancelDelete}>Cancel</Button>
 *                     </>
 *                 ) : (
 *                     <Button onClick={() => deleteConfirm.requestDelete(item.id)}>
 *                         Delete
 *                     </Button>
 *                 )}
 *             </div>
 *         ))}
 *     </>
 * )
 * ```
 */
export function useDeleteConfirm(): UseDeleteConfirmReturn {
    const [confirmingId, setConfirmingId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Request deletion confirmation
    const requestDelete = useCallback((id: string) => {
        setConfirmingId(id)
        setError(null)
    }, [])

    // Cancel deletion
    const cancelDelete = useCallback(() => {
        setConfirmingId(null)
        setError(null)
    }, [])

    // Execute deletion
    const confirmDelete = useCallback(async (onDelete: (id: string) => Promise<void>) => {
        if (!confirmingId) return

        try {
            setDeleting(true)
            setError(null)
            await onDelete(confirmingId)
            setConfirmingId(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete')
        } finally {
            setDeleting(false)
        }
    }, [confirmingId])

    // Check if specific item is pending confirmation
    const isConfirming = useCallback((id: string) => {
        return confirmingId === id
    }, [confirmingId])

    return {
        confirmingId,
        deleting,
        error,
        requestDelete,
        confirmDelete,
        cancelDelete,
        isConfirming
    }
}
