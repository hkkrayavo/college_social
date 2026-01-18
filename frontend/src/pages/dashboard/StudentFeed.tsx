import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { apiClient } from '../../services/api'

interface Post {
    id: string
    title: string | null
    content: string
    author: { id: string; name: string }
    groups: { id: string; name: string }[]
    likesCount: number
    commentsCount: number
    createdAt: string
}

interface Event {
    id: string
    name: string
    date: string
    description: string | null
}

interface UserStats {
    totalPosts: number
    totalLikes: number
    totalComments: number
    groupsCount: number
}

export function StudentFeed() {
    const { user } = useAuth()
    const [events, setEvents] = useState<Event[]>([])
    const [stats, setStats] = useState<UserStats>({ totalPosts: 0, totalLikes: 0, totalComments: 0, groupsCount: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)

            // Load upcoming events
            try {
                const eventsRes = await apiClient.get<{ success: boolean; data: Event[] }>('/events?limit=3')
                setEvents(eventsRes.data || [])
            } catch {
                // Events endpoint might not exist
            }

            // Load user stats (my posts)
            try {
                const myPostsRes = await apiClient.get<{ success: boolean; data: Post[]; pagination: { total: number } }>('/posts?mine=true&limit=1')
                const groupsRes = await apiClient.get<{ success: boolean; data: { id: string }[] }>('/groups')

                // Calculate total likes and comments from my posts
                let totalLikes = 0
                let totalComments = 0
                if (myPostsRes.data) {
                    myPostsRes.data.forEach(p => {
                        totalLikes += p.likesCount || 0
                        totalComments += p.commentsCount || 0
                    })
                }

                setStats({
                    totalPosts: myPostsRes.pagination?.total || 0,
                    totalLikes,
                    totalComments,
                    groupsCount: groupsRes.data?.length || 0,
                })
            } catch {
                // Stats might fail
            }
        } finally {
            setLoading(false)
        }
    }



    const formatEventDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }



    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-navy to-navy/80 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold">
                    Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
                </h1>
                <p className="text-white/80 mt-1">
                    Here's what's happening in your college community
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy/10 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-navy">{loading ? '—' : stats.totalPosts}</p>
                            <p className="text-xs text-gray-500">My Posts</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-navy">{loading ? '—' : stats.totalLikes}</p>
                            <p className="text-xs text-gray-500">Likes Received</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-navy">{loading ? '—' : stats.totalComments}</p>
                            <p className="text-xs text-gray-500">Comments</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-navy">{loading ? '—' : stats.groupsCount}</p>
                            <p className="text-xs text-gray-500">My Groups</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    to="/dashboard/user/posts/new"
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-gold hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 bg-navy rounded-lg flex items-center justify-center group-hover:bg-gold transition-colors">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mt-3">Create Post</h3>
                    <p className="text-sm text-gray-500 mt-1">Share with your groups</p>
                </Link>

                <Link
                    to="/dashboard/albums"
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-gold hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mt-3">View Albums</h3>
                    <p className="text-sm text-gray-500 mt-1">Browse event photos</p>
                </Link>

                <Link
                    to="/dashboard/user/posts"
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-gold hover:shadow-md transition-all group"
                >
                    <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                        <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 mt-3">Browse Posts</h3>
                    <p className="text-sm text-gray-500 mt-1">View all posts</p>
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-navy flex items-center gap-2">
                            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Upcoming Events
                        </h2>
                        <Link to="/dashboard/albums" className="text-xs text-gold hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="p-5">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2].map(i => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-4">
                                <div className="text-3xl mb-2">📅</div>
                                <p className="text-sm text-gray-500">No upcoming events</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {events.map(event => (
                                    <div key={event.id} className="flex gap-3">
                                        <div className="w-12 h-12 bg-gold/20 rounded-lg flex flex-col items-center justify-center text-navy">
                                            <span className="text-xs font-medium">
                                                {new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold leading-none">
                                                {new Date(event.date).getDate()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{event.name}</p>
                                            <p className="text-xs text-gray-500">{formatEventDate(event.date)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Summary (Your Activity) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-navy flex items-center gap-2">
                            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Your Activity
                        </h2>
                    </div>
                    <div className="p-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Posts Created</span>
                                <span className="font-semibold text-navy">{loading ? '—' : stats.totalPosts}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className="bg-navy h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, (stats.totalPosts || 0) * 10)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <span className="text-sm text-gray-600">Engagement Rate</span>
                                <span className="font-semibold text-navy">
                                    {loading ? '—' : stats.totalPosts > 0
                                        ? Math.round((stats.totalLikes + stats.totalComments) / stats.totalPosts)
                                        : 0
                                    } avg
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className="bg-gold h-2 rounded-full transition-all"
                                    style={{
                                        width: `${Math.min(100, stats.totalPosts > 0
                                            ? ((stats.totalLikes + stats.totalComments) / stats.totalPosts) * 10
                                            : 0
                                        )}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StudentFeed
