import { useState, useEffect } from 'react'
import { interactionService, type InteractionType, type LikerUser } from '../../services/interactionService'
import { getAvatarColor } from '../../utils'

interface LikersListProps {
    type: InteractionType
    id: string
    compact?: boolean
    initialCount?: number
}

export function LikersList({ type, id, compact = true, initialCount = 0 }: LikersListProps) {
    const [users, setUsers] = useState<LikerUser[]>([])
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(!compact)
    const [count, setCount] = useState(initialCount)

    useEffect(() => {
        if (expanded) {
            loadLikers()
        }
    }, [expanded, type, id])

    // Update count when initialCount changes
    useEffect(() => {
        setCount(initialCount)
    }, [initialCount])

    const loadLikers = async () => {
        try {
            setLoading(true)
            const res = await interactionService.getLikes(type, id)
            setUsers(res.users || [])
            setCount(res.likesCount)
        } catch (err) {
            console.error('Failed to load likers:', err)
        } finally {
            setLoading(false)
        }
    }

    // Compact toggle button (like comment button)
    if (compact && !expanded) {
        return (
            <button
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{count > 0 ? count : ''} Likes</span>
            </button>
        )
    }

    return (
        <div className="space-y-2">
            {/* Header - shown in compact mode when expanded, or always in non-compact mode */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                    {loading ? 'Loading...' : `Liked by (${users.length})`}
                </h4>
                {compact && (
                    <button
                        onClick={() => setExpanded(false)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Likers List */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
                {loading ? (
                    <div className="text-center py-4">
                        <div className="animate-spin w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full mx-auto"></div>
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-center text-sm py-4 text-gray-400">
                        No likes yet
                    </p>
                ) : (
                    users.map(user => (
                        <div
                            key={user.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                        >
                            {user.profilePictureUrl ? (
                                <img
                                    src={user.profilePictureUrl}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <span
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(user.name)}`}
                                >
                                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                            )}
                            <span className="text-sm font-medium text-gray-800">
                                {user.name}
                            </span>
                            <svg className="w-4 h-4 text-red-400 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
