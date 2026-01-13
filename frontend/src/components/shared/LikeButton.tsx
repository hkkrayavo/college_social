import { useState, useEffect } from 'react'
import { interactionService, type InteractionType } from '../../services/interactionService'

interface LikeButtonProps {
    type: InteractionType
    id: string
    initialLiked?: boolean
    initialCount?: number
    size?: 'sm' | 'md'
    onStateChange?: (liked: boolean, count: number) => void
}

export function LikeButton({ type, id, initialLiked = false, initialCount = 0, size = 'md', onStateChange }: LikeButtonProps) {
    const [liked, setLiked] = useState(initialLiked)
    const [count, setCount] = useState(initialCount)
    const [loading, setLoading] = useState(false)

    // Sync state with props when they change (e.g. parent updates or ID changes)
    useEffect(() => {
        setLiked(initialLiked)
        setCount(initialCount)
    }, [initialLiked, initialCount, id])

    const handleClick = async () => {
        if (loading) return

        const previousLiked = liked
        const previousCount = count
        const newLiked = !liked
        const newCount = newLiked ? count + 1 : count - 1

        // Optimistic update
        setLiked(newLiked)
        setCount(newCount)
        onStateChange?.(newLiked, newCount)

        try {
            setLoading(true)
            if (previousLiked) { // Check previous state to decide action
                const res = await interactionService.unlike(type, id)
                // Ensure we sync with actual server response
                setLiked(res.liked)
                setCount(res.likesCount)
                onStateChange?.(res.liked, res.likesCount)
            } else {
                const res = await interactionService.like(type, id)
                // Ensure we sync with actual server response
                setLiked(res.liked)
                setCount(res.likesCount)
                onStateChange?.(res.liked, res.likesCount)
            }
        } catch (err) {
            console.error('Failed to toggle like:', err)
            // Revert on error
            setLiked(previousLiked)
            setCount(previousCount)
            onStateChange?.(previousLiked, previousCount)
        } finally {
            setLoading(false)
        }
    }

    const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
    const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5'

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`
                inline-flex items-center gap-1.5 rounded-full transition-all
                ${padding} ${textSize}
                ${liked
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                ${loading ? 'opacity-50 cursor-wait' : ''}
            `}
        >
            <svg
                className={iconSize}
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            <span>{count > 0 ? count : ''}</span>
        </button>
    )
}
