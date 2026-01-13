import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../services/api'

interface GroupItem {
    id: string
    name: string
    description: string | null
    type: string
    memberCount?: number
}

export function StudentGroups() {
    const [groups, setGroups] = useState<GroupItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadGroups = useCallback(async () => {
        try {
            setLoading(true)
            // GET /api/groups (without ?all=true) returns user's groups
            const response = await apiClient.get<{ success: boolean; data: GroupItem[] }>('/groups')
            setGroups(response.data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load groups')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadGroups()
    }, [loadGroups])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your groups...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                {error}
                <button onClick={loadGroups} className="ml-4 underline">Retry</button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-navy">My Groups</h1>
                <p className="text-gray-500 mt-1">Groups you're a member of</p>
            </div>

            {groups.length === 0 ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p>You're not a member of any groups yet.</p>
                        <p className="text-sm mt-2">Contact your admin to be added to groups.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map(group => (
                        <div
                            key={group.id}
                            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-navy/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-800 truncate">{group.name}</h3>
                                    <p className="text-sm text-gray-500">{group.type}</p>
                                    {group.description && (
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{group.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default StudentGroups
