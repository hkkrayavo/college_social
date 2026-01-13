import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { Button } from '../../components/common/Button'
import { GroupSelector } from '../../components/shared/GroupSelector'

export function EventForm() {
    const { eventId } = useParams<{ eventId: string }>()
    const navigate = useNavigate()
    const isEditing = !!eventId

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        date: '',
        endDate: '',
        startTime: '',
        endTime: '',
        description: '',
        groupIds: [] as string[],
    })

    // Selected groups with names for display (used for form submission and passed to selector)
    const [selectedGroups, setSelectedGroups] = useState<{ id: string; name: string }[]>([])

    // Load data
    useEffect(() => {
        loadInitialData()
    }, [eventId])

    const loadInitialData = async () => {
        try {
            setLoading(true)

            // Load event if editing
            if (eventId) {
                const event = await adminService.getEvent(eventId)
                const eventGroups = event.groups || []
                setFormData({
                    name: event.name,
                    date: event.date,
                    endDate: event.endDate || '',
                    startTime: event.startTime || '',
                    endTime: event.endTime || '',
                    description: event.description || '',
                    groupIds: eventGroups.map((g: { id: string }) => g.id),
                })
                setSelectedGroups(eventGroups)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            const data = {
                name: formData.name,
                date: formData.date,
                endDate: formData.endDate || undefined,
                startTime: formData.startTime || undefined,
                endTime: formData.endTime || undefined,
                description: formData.description || undefined,
                groupIds: formData.groupIds.length > 0 ? formData.groupIds : undefined,
            }

            if (isEditing) {
                await adminService.updateEvent(eventId!, data)
            } else {
                await adminService.createEvent(data)
            }

            navigate('/dashboard/admin/events')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save event')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-[90%] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <Button
                        onClick={() => navigate('/dashboard/admin/events')}
                        variant="ghost"
                        className="text-gray-500 hover:text-navy"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <h1 className="text-xl font-bold text-navy">
                        {isEditing ? 'Edit Event' : 'Create Event'}
                    </h1>
                </div>
                <p className="text-gray-500 text-sm ml-10">
                    {isEditing ? 'Update the event details below' : 'Fill in the event details to create a new event'}
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Event Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                            placeholder="e.g., Annual Day 2026"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                min={formData.date}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Time <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Time <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all resize-none"
                            placeholder="Add a description for this event..."
                        />
                    </div>

                    {/* Group Selection with Search */}
                    <div>
                        <GroupSelector
                            selectedGroups={selectedGroups}
                            onChange={(groups) => {
                                setSelectedGroups(groups)
                                setFormData(prev => ({ ...prev, groupIds: groups.map(g => g.id) }))
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => navigate('/dashboard/admin/events')}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            loading={submitting}
                            variant="primary"
                            className="flex-1"
                        >
                            {submitting ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EventForm
