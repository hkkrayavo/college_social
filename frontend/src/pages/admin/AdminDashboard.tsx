
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService, type DashboardStats } from '../../services/adminService'
import { Button } from '../../components/common'

export function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            setLoading(true)
            const data = await adminService.getStats()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load stats')
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        {
            label: 'Pending Users',
            value: stats?.pendingUsers ?? 0,
            link: '/dashboard/admin/users/pending',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
            description: 'Awaiting approval',
            iconClass: 'bg-gold text-navy'
        },
        {
            label: 'Pending Posts',
            value: stats?.pendingPosts ?? 0,
            link: '/dashboard/admin/posts/pending',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            description: 'Need moderation',
            iconClass: 'bg-navy text-gold'
        },
        {
            label: 'Total Users',
            value: stats?.totalUsers ?? 0,
            link: '/dashboard/admin/users',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            description: 'Registered members',
            iconClass: 'bg-navy text-white'
        },
        {
            label: 'Total Groups',
            value: stats?.totalGroups ?? 0,
            link: '/dashboard/admin/groups',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            description: 'Active circles',
            iconClass: 'bg-navy text-white'
        },
    ]

    const quickActions = [
        {
            label: 'Add New User',
            link: '/dashboard/admin/users',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            )
        },
        {
            label: 'Create Group',
            link: '/dashboard/admin/groups',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            label: 'Create Event',
            link: '/dashboard/admin/events/new',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            label: 'View All Posts',
            link: '/dashboard/admin/posts',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            )
        },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-2">Welcome back! Here's what's happening in your community.</p>
                </div>
                <Button
                    onClick={loadStats}
                    variant="outline"
                    size="sm"
                    loading={loading}
                    leftIcon={
                        !loading && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )
                    }
                    className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
                >
                    Refresh
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700">{error}</span>
                    <button onClick={loadStats} className="ml-auto text-red-600 hover:text-red-800 underline text-sm">Retry</button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((stat) => (
                    <Link
                        key={stat.label}
                        to={stat.link}
                        className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gold transition-all duration-300 overflow-hidden"
                    >
                        {/* Hover background */}
                        <div className="absolute inset-0 bg-cream opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-4xl font-bold text-navy mt-2">
                                    {loading ? (
                                        <span className="inline-block w-16 h-10 bg-gray-200 rounded animate-pulse" />
                                    ) : (
                                        <span className="tabular-nums">{stat.value.toLocaleString()}</span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${stat.iconClass}`}>
                                {stat.icon}
                            </div>
                        </div>

                        {/* Arrow indicator */}
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-navy/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {quickActions.map((action, index) => (
                        <Link
                            key={action.label}
                            to={action.link}
                            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm ${index === 0
                                ? 'bg-navy text-white hover:bg-navy/90'
                                : 'bg-white text-navy border border-navy/20 hover:border-gold hover:bg-gold/10'
                                }`}
                        >
                            {action.icon}
                            {action.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Pending Items Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Users */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-navy/5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-navy">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                Pending Registrations
                            </h2>
                            {!loading && stats?.pendingUsers ? (
                                <span className="px-2.5 py-1 bg-gold text-navy text-xs font-bold rounded-full">
                                    {stats.pendingUsers}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="text-center py-6">
                            {loading ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                                </div>
                            ) : stats?.pendingUsers ? (
                                <>
                                    <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl font-bold text-navy">{stats.pendingUsers}</span>
                                    </div>
                                    <p className="text-gray-600">New users are waiting for your approval</p>
                                    <p className="text-sm text-gray-400 mt-1">Review and approve them to grant access</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium">All caught up!</p>
                                    <p className="text-sm text-gray-400 mt-1">No pending registrations</p>
                                </>
                            )}
                        </div>
                        <Link
                            to="/dashboard/admin/users/pending"
                            className="block w-full text-center py-2.5 border-2 border-navy text-navy rounded-xl font-medium hover:bg-navy hover:text-white transition-colors"
                        >
                            View Pending Users
                        </Link>
                    </div>
                </div>

                {/* Pending Posts */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-navy/5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-gold">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                Posts Moderation
                            </h2>
                            {!loading && stats?.pendingPosts ? (
                                <span className="px-2.5 py-1 bg-navy text-white text-xs font-bold rounded-full">
                                    {stats.pendingPosts}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="text-center py-6">
                            {loading ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                                </div>
                            ) : stats?.pendingPosts ? (
                                <>
                                    <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl font-bold text-navy">{stats.pendingPosts}</span>
                                    </div>
                                    <p className="text-gray-600">Posts are waiting for moderation</p>
                                    <p className="text-sm text-gray-400 mt-1">Review content before publishing</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium">All caught up!</p>
                                    <p className="text-sm text-gray-400 mt-1">No posts pending approval</p>
                                </>
                            )}
                        </div>
                        <Link
                            to="/dashboard/admin/posts/pending"
                            className="block w-full text-center py-2.5 border-2 border-navy text-navy rounded-xl font-medium hover:bg-navy hover:text-white transition-colors"
                        >
                            View Pending Posts
                        </Link>
                    </div>
                </div>
            </div>

            {/* Community Overview */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Community Overview
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-2xl font-bold text-navy">{loading ? '—' : stats?.totalUsers ?? 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Members</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-2xl font-bold text-navy">{loading ? '—' : stats?.totalGroups ?? 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Active Groups</p>
                    </div>
                    <div className="text-center p-4 bg-gold/10 rounded-xl border border-gold/30">
                        <p className="text-2xl font-bold text-navy">{loading ? '—' : stats?.pendingUsers ?? 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Pending Users</p>
                    </div>
                    <div className="text-center p-4 bg-navy/5 rounded-xl border border-navy/20">
                        <p className="text-2xl font-bold text-navy">{loading ? '—' : stats?.pendingPosts ?? 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Pending Posts</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
