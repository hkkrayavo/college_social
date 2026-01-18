/**
 * Generates a consistent color class based on a name string.
 * Used for avatar backgrounds when no profile picture is available.
 */
export const getAvatarColor = (name: string): string => {
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
