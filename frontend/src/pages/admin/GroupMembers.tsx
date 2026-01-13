import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminService, type UserItem } from '../../services/adminService'
import { Button } from '../../components/common/Button'
import { Avatar } from '../../components/common/Avatar'

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_RESULTS_LIMIT = 15

export function GroupMembers() {
    const { groupId } = useParams<{ groupId: string }>()
    const navigate = useNavigate()

    const [groupName, setGroupName] = useState('')
    const [members, setMembers] = useState<UserItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // User search state
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState<UserItem[]>([])
    const [initialUsers, setInitialUsers] = useState<UserItem[]>([])
    const [loadingSearch, setLoadingSearch] = useState(false)
    const [loadingInitial, setLoadingInitial] = useState(true)
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Selected users (stored as full objects for chip display)
    const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([])
    const [addingMembers, setAddingMembers] = useState(false)

    // Removal state
    const [membersToRemove, setMembersToRemove] = useState<UserItem[]>([])
    const [removingMembers, setRemovingMembers] = useState(false)

    // Member search
    const [memberSearch, setMemberSearch] = useState('')

    // Load group info and members
    const loadInitialData = useCallback(async () => {
        if (!groupId) return

        try {
            setLoading(true)
            const [membersRes, groupsRes] = await Promise.all([
                adminService.getGroupMembers(groupId),
                adminService.getAllGroups(1, 100)
            ])

            setMembers(membersRes.members || [])
            setMembersToRemove([]) // Clear selection on reload

            // Find group name
            const group = groupsRes.data.find(g => g.id === groupId)
            setGroupName(group?.name || 'Unknown Group')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }, [groupId])

    // Load initial available users
    const loadInitialUsers = useCallback(async () => {
        try {
            setLoadingInitial(true)
            const res = await adminService.getAllUsers(1, SEARCH_RESULTS_LIMIT)
            setInitialUsers(res.data || [])
        } catch (err) {
            console.error('Failed to load initial users:', err)
        } finally {
            setLoadingInitial(false)
        }
    }, [])

    // Debounced user search
    const searchUsers = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSearchResults([])
            return
        }

        try {
            setLoadingSearch(true)
            const res = await adminService.getAllUsers(1, SEARCH_RESULTS_LIMIT, undefined, query)
            setSearchResults(res.data || [])
        } catch (err) {
            console.error('Search failed:', err)
            setSearchResults([])
        } finally {
            setLoadingSearch(false)
        }
    }, [])

    // Handle search input with debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (userSearch.trim().length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                searchUsers(userSearch)
            }, SEARCH_DEBOUNCE_MS)
        } else {
            setSearchResults([])
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [userSearch, searchUsers])

    useEffect(() => {
        loadInitialData()
        loadInitialUsers()
    }, [loadInitialData, loadInitialUsers])

    // Get available users (either search results or initial list, filtered)
    const displayUsers = userSearch.trim().length >= 2 ? searchResults : initialUsers
    const memberIds = new Set(members.map(m => m.id))
    const selectedIds = new Set(selectedUsers.map(u => u.id))
    const availableUsers = displayUsers.filter(u => !memberIds.has(u.id) && !selectedIds.has(u.id))

    // Add user to selection
    const handleSelectUser = (user: UserItem) => {
        setSelectedUsers(prev => [...prev, user])
        setSearchResults(prev => prev.filter(u => u.id !== user.id))
    }

    // Remove user from selection
    const handleDeselectUser = (userId: string) => {
        setSelectedUsers(prev => prev.filter(u => u.id !== userId))
    }

    // Selection handlers for Removal
    const handleSelectMemberToRemove = (member: UserItem) => {
        setMembersToRemove(prev => {
            if (prev.find(m => m.id === member.id)) {
                return prev.filter(m => m.id !== member.id)
            }
            return [...prev, member]
        })
    }

    const handleDeselectMemberToRemove = (memberId: string) => {
        setMembersToRemove(prev => prev.filter(m => m.id !== memberId))
    }

    // Add members to group
    const handleAddMembers = async () => {
        if (!groupId || selectedUsers.length === 0) return
        setAddingMembers(true)
        try {
            const userIds = selectedUsers.map(u => u.id)
            await adminService.addGroupMembers(groupId, userIds)
            const membersRes = await adminService.getGroupMembers(groupId)
            setMembers(membersRes.members || [])
            setSelectedUsers([])
            setUserSearch('')
            setSearchResults([])
            loadInitialUsers() // Refresh initial list
        } catch (err) {
            console.error('Failed to add members:', err)
        } finally {
            setAddingMembers(false)
        }
    }



    // Bulk Remove members
    const handleBulkRemove = async () => {
        if (!groupId || membersToRemove.length === 0) return
        setRemovingMembers(true)
        try {
            // Execute removals in parallel
            await Promise.all(membersToRemove.map(member =>
                adminService.removeGroupMember(groupId, member.id)
            ))

            const removedIds = new Set(membersToRemove.map(m => m.id))
            setMembers(prev => prev.filter(m => !removedIds.has(m.id)))
            setMembersToRemove([])
        } catch (err) {
            console.error('Failed to remove members:', err)
            // Reload to ensure sync
            loadInitialData()
        } finally {
            setRemovingMembers(false)
        }
    }

    // Filter current members by search
    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.mobileNumber.includes(memberSearch)
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading group members...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
                {error}
                <Button onClick={loadInitialData} variant="ghost" className="ml-4 underline text-red-700 hover:text-red-800 hover:bg-red-100 p-0 h-auto">Retry</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => navigate('/dashboard/admin/groups')}
                        variant="ghost"
                        className="text-gray-500 hover:text-navy"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-navy">{groupName}</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Manage group members</p>
                    </div>
                </div>
                <Link
                    to="/dashboard/admin/groups"
                    className="text-navy hover:underline text-sm"
                >
                    Back to Groups
                </Link>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Add Members */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-800">Add Members</h2>
                        <p className="text-sm text-gray-500 mt-1">Search users to add to this group</p>
                    </div>

                    {/* Search Input */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name or phone (min 2 chars)..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                            />
                            {loadingSearch && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Users as Chips */}
                    {selectedUsers.length > 0 && (
                        <div className="p-4 bg-green-50 border-b border-green-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-green-700">
                                    {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                                </span>
                                <button
                                    onClick={() => setSelectedUsers([])}
                                    className="text-xs text-green-600 hover:text-green-800"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map(user => (
                                    <span
                                        key={user.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm"
                                    >
                                        {user.name}
                                        <button
                                            onClick={() => handleDeselectUser(user.id)}
                                            className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {(loadingInitial && userSearch.length < 2) ? (
                            <div className="text-center py-8 text-gray-400">
                                <div className="animate-spin w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full mx-auto mb-2"></div>
                                Loading users...
                            </div>
                        ) : loadingSearch ? (
                            <div className="text-center py-8 text-gray-400">
                                <div className="animate-spin w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full mx-auto mb-2"></div>
                                Searching...
                            </div>
                        ) : availableUsers.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>{userSearch.length >= 2 ? `No users found matching "${userSearch}"` : 'No available users'}</p>
                                {userSearch.length >= 2 && <p className="text-sm mt-1">Try a different search term</p>}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {availableUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 border-2 border-transparent hover:border-green-200 transition-colors text-left"
                                    >
                                        <Avatar
                                            src={user.profilePictureUrl}
                                            name={user.name}
                                            size="md"
                                            className="bg-navy/10 text-navy flex-shrink-0"
                                            fallbackClassName="bg-navy/10 text-navy"
                                        />
                                        <div className="ml-3 flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{user.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{user.mobileNumber}</p>
                                        </div>
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                ))}
                                {availableUsers.length >= SEARCH_RESULTS_LIMIT && (
                                    <p className="text-center text-sm text-gray-400 py-2">
                                        Refine your search to see more results
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Add Button */}
                    {selectedUsers.length > 0 && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <Button
                                onClick={handleAddMembers}
                                disabled={addingMembers}
                                variant="success"
                                fullWidth
                                className="py-3"
                            >
                                {addingMembers ? 'Adding...' : `Add ${selectedUsers.length} Member${selectedUsers.length > 1 ? 's' : ''} to Group`}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column: Current Members */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800">Current Members</h2>
                            <p className="text-sm text-gray-500 mt-1">{members.length} member{members.length !== 1 ? 's' : ''} in this group</p>
                        </div>
                    </div>

                    <div className="p-4 border-b border-gray-100">
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Selected Members to Remove */}
                    {membersToRemove.length > 0 && (
                        <div className="p-4 bg-red-50 border-b border-red-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-red-700">
                                    {membersToRemove.length} member{membersToRemove.length > 1 ? 's' : ''} selected
                                </span>
                                <button
                                    onClick={() => setMembersToRemove([])}
                                    className="text-xs text-red-600 hover:text-red-800"
                                >
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {membersToRemove.map(member => (
                                    <span
                                        key={member.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm"
                                    >
                                        {member.name}
                                        <button
                                            onClick={() => handleDeselectMemberToRemove(member.id)}
                                            className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredMembers.length === 0 ? (
                            <p className="text-center text-gray-400 py-12">
                                {memberSearch ? 'No members match your search' : 'No members in this group yet'}
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {filteredMembers.map(member => {
                                    const isSelected = membersToRemove.some(m => m.id === member.id)
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => handleSelectMemberToRemove(member)}
                                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors cursor-pointer group ${isSelected
                                                ? 'bg-red-50 border-red-200'
                                                : 'hover:bg-gray-50 border-transparent hover:border-red-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={member.profilePictureUrl}
                                                    name={member.name}
                                                    size="md"
                                                    className={`${isSelected ? 'bg-red-100 text-red-700' : 'bg-navy/10 text-navy'}`}
                                                    fallbackClassName={`${isSelected ? 'bg-red-100 text-red-700' : 'bg-navy/10 text-navy'}`}
                                                />
                                                <div>
                                                    <p className={`font-medium ${isSelected ? 'text-red-900' : 'text-gray-800'}`}>
                                                        {member.name}
                                                    </p>
                                                    <p className={`text-sm ${isSelected ? 'text-red-700/70' : 'text-gray-500'}`}>
                                                        {member.mobileNumber}
                                                    </p>
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                            </svg>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bulk Remove Button */}
                    {membersToRemove.length > 0 && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <Button
                                onClick={handleBulkRemove}
                                disabled={removingMembers}
                                variant="danger"
                                fullWidth
                                className="py-3"
                            >
                                {removingMembers ? 'Removing...' : `Remove ${membersToRemove.length} Member${membersToRemove.length > 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GroupMembers
