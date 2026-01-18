import { apiClient } from './api'

// Types for admin API responses
export interface DashboardStats {
    pendingUsers: number
    totalUsers: number
    pendingPosts: number
    totalGroups: number
}

export interface GroupType {
    id: string
    label: string
    description: string | null
}

export interface UserItem {
    id: string
    name: string
    mobileNumber: string
    email: string | null
    profilePictureUrl?: string
    status: string
    role: string
    createdAt: string
}

export interface PaginatedResponse<T> {
    success: boolean
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface PostItem {
    id: string
    title: string | null
    content: string
    status: string
    author: {
        id: string
        name: string
        profilePictureUrl?: string
    }
    groups: {
        id: string
        name: string
    }[]
    createdAt: string
}

export interface GroupItem {
    id: string
    name: string
    description: string | null
    type: string
    createdAt: string
}

export interface AlbumItem {
    id: string
    name: string
    eventId: string
    description: string | null
    coverImage: string | null
    mediaCount: number
    groups: { id: string; name: string }[]
    createdAt: string
}

export interface AlbumDetail extends AlbumItem {
    event: { id: string; name: string; date: string } | null
    creator: { id: string; name: string }
    media: { id: string; mediaUrl: string; mediaType: string; caption: string | null }[]
}

export interface EventItem {
    id: string
    name: string
    date: string
    endDate: string | null
    startTime: string | null
    endTime: string | null
    description: string | null
    albumCount: number
    groups?: { id: string; name: string }[]
    creator?: { id: string; name: string }
    createdAt: string
}

export interface EventDetail extends EventItem {
    albums: AlbumItem[]
}

export interface SmsTemplate {
    id: string
    key: string
    name: string
    description: string | null
    content: string
    variables: string[]
    isActive: boolean
}

// Admin service - RESTful endpoints
export const adminService = {
    // ==========================================
    // Dashboard
    // ==========================================

    // GET /api/users/stats - Dashboard stats
    async getStats(): Promise<DashboardStats> {
        const response = await apiClient.get<{ success: boolean; stats: DashboardStats }>('/users/stats')
        return response.stats
    },

    // ==========================================
    // Users (RESTful - no /admin/ prefix)
    // ==========================================

    // GET /api/users?status=pending,rejected - Get pending/rejected users
    async getPendingUsers(page = 1, limit = 20, statuses: string[] = ['pending']): Promise<PaginatedResponse<UserItem>> {
        return apiClient.get(`/users?status=${statuses.join(',')}&page=${page}&limit=${limit}`)
    },

    // GET /api/users - Get all users with optional filters
    async getAllUsers(page = 1, limit = 20, status?: string, search?: string): Promise<PaginatedResponse<UserItem>> {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) })
        if (status) params.append('status', status)
        if (search) params.append('search', search)
        return apiClient.get(`/users?${params.toString()}`)
    },

    // POST /api/users - Create user (admin)
    async createUser(data: { name: string; mobileNumber: string; email?: string; role?: string }): Promise<void> {
        await apiClient.post('/users', data)
    },

    // PATCH /api/users/:id - Update user
    async updateUser(userId: string, data: { name?: string; email?: string; role?: string; status?: string }): Promise<void> {
        await apiClient.patch(`/users/${userId}`, data)
    },

    // PATCH /api/users/:id/status - Update user status (approve/reject)
    async updateUserStatus(userId: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
        await apiClient.patch(`/users/${userId}/status`, { status, reason })
    },

    // Approve user (convenience wrapper)
    async approveUser(userId: string, message?: string): Promise<void> {
        await this.updateUserStatus(userId, 'approved', message)
    },

    // Reject user (convenience wrapper)
    async rejectUser(userId: string, reason?: string): Promise<void> {
        await this.updateUserStatus(userId, 'rejected', reason)
    },

    // DELETE /api/users/:id - Delete user
    async deleteUser(userId: string): Promise<void> {
        await apiClient.delete(`/users/${userId}`)
    },

    // GET /api/users/:id/groups - Get groups a user belongs to
    async getUserGroups(userId: string): Promise<{ id: string; name: string; description?: string }[]> {
        const response = await apiClient.get<{ success: boolean; groups: { id: string; name: string; description?: string }[] }>(`/users/${userId}/groups`)
        return response.groups
    },

    // ==========================================
    // Posts (RESTful - no /admin/ prefix)
    // ==========================================

    // GET /api/groups/types - Get available group types
    async getGroupTypes(): Promise<{ success: boolean; data: GroupType[] }> {
        return apiClient.get('/groups/types')
    },

    // POST /api/groups/types - Create group type
    async createGroupType(data: { label: string; description?: string }): Promise<{ success: boolean; data: GroupType }> {
        return apiClient.post('/groups/types', data)
    },

    // PATCH /api/groups/types/:id - Update group type
    async updateGroupType(id: string, data: { label?: string; description?: string }): Promise<{ success: boolean; data: GroupType }> {
        return apiClient.patch(`/groups/types/${id}`, data)
    },

    // DELETE /api/groups/types/:id - Delete group type
    async deleteGroupType(id: string): Promise<void> {
        await apiClient.delete(`/groups/types/${id}`)
    },

    // GET /api/posts - Get all posts with optional status filter
    // GET /api/posts - Get all posts with optional status filter
    async getAllPosts(page = 1, limit = 20, status?: string): Promise<PaginatedResponse<PostItem>> {
        let url = `/posts?all=true&page=${page}&limit=${limit}`
        if (status && status !== 'all') {
            url += `&status=${status}`
        }
        return apiClient.get(url)
    },

    // GET /api/posts?status=pending - Get pending posts (or other statuses)
    async getPendingPosts(page = 1, limit = 20, statuses: string[] = ['pending']): Promise<PaginatedResponse<PostItem>> {
        const statusParam = statuses.join(',')
        return apiClient.get(`/posts?status=${statusParam}&page=${page}&limit=${limit}`)
    },

    // GET /api/posts/:id - Get single post
    async getPost(postId: string): Promise<PostItem> {
        const response = await apiClient.get<{ success: boolean; data: PostItem }>(`/posts/${postId}`)
        return response.data
    },

    // PATCH /api/posts/:id/status - Update post status
    // PATCH /api/posts/:id/status - Update post status
    async updatePostStatus(postId: string, status: 'approved' | 'rejected' | 'pending', reason?: string, groupIds?: string[]): Promise<void> {
        await apiClient.patch(`/posts/${postId}/status`, { status, reason, groupIds })
    },

    // Approve post (convenience wrapper)
    async approvePost(postId: string, groupIds?: string[]): Promise<void> {
        await this.updatePostStatus(postId, 'approved', undefined, groupIds)
    },

    // Reject post (convenience wrapper)
    async rejectPost(postId: string, reason?: string): Promise<void> {
        await this.updatePostStatus(postId, 'rejected', reason)
    },

    // DELETE /api/posts/:id - Delete post
    async deletePost(postId: string): Promise<void> {
        await apiClient.delete(`/posts/${postId}`)
    },

    // ==========================================
    // Groups (RESTful - no /admin/ prefix)
    // ==========================================

    // GET /api/groups?all=true - Get all groups with optional search
    async getAllGroups(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<GroupItem>> {
        let url = `/groups?all=true&page=${page}&limit=${limit}`
        if (search && search.trim().length > 0) {
            url += `&search=${encodeURIComponent(search.trim())}`
        }
        return apiClient.get(url)
    },

    // POST /api/groups - Create group
    async createGroup(data: { name: string; description?: string; groupTypeId?: string }): Promise<void> {
        return apiClient.post('/groups', data)
    },

    // PATCH /api/groups/:id - Update group
    async updateGroup(groupId: string, data: { name?: string; description?: string; groupTypeId?: string }): Promise<void> {
        return apiClient.patch(`/groups/${groupId}`, data)
    },

    // DELETE /api/groups/:id - Delete group
    async deleteGroup(groupId: string): Promise<void> {
        await apiClient.delete(`/groups/${groupId}`)
    },

    // GET /api/groups/:id/members - Get group members
    async getGroupMembers(groupId: string): Promise<{ success: boolean; members: UserItem[] }> {
        return apiClient.get(`/groups/${groupId}/members`)
    },

    // POST /api/groups/:id/members - Add members to group
    async addGroupMembers(groupId: string, userIds: string[]): Promise<void> {
        await apiClient.post(`/groups/${groupId}/members`, { userIds })
    },

    // Add a user to multiple groups
    async addUserToGroups(userId: string, groupIds: string[]): Promise<void> {
        await Promise.all(groupIds.map(groupId =>
            apiClient.post(`/groups/${groupId}/members`, { userIds: [userId] })
        ))
    },

    // DELETE /api/groups/:id/members/:userId - Remove member from group
    async removeGroupMember(groupId: string, userId: string): Promise<void> {
        await apiClient.delete(`/groups/${groupId}/members/${userId}`)
    },

    // ==========================================
    // Albums (RESTful - no /admin/ prefix)
    // ==========================================

    // GET /api/albums?all=true - Get all albums
    async getAllAlbums(page = 1, limit = 20): Promise<PaginatedResponse<AlbumItem>> {
        return apiClient.get(`/albums?all=true&page=${page}&limit=${limit}`)
    },

    // GET /api/albums/:id - Get album with media
    async getAlbum(albumId: string): Promise<AlbumDetail> {
        const response = await apiClient.get<{ success: boolean; album: AlbumDetail }>(`/albums/${albumId}`)
        return response.album
    },

    // POST /api/events/:eventId/albums - Create album within event
    async createAlbum(eventId: string, data: {
        name: string
        description?: string
        groupIds?: string[]
    }): Promise<void> {
        await apiClient.post(`/events/${eventId}/albums`, data)
    },

    // PATCH /api/albums/:id - Update album
    async updateAlbum(albumId: string, data: {
        name?: string
        description?: string
        groupIds?: string[]
    }): Promise<void> {
        await apiClient.patch(`/albums/${albumId}`, data)
    },

    // DELETE /api/albums/:id - Delete album
    async deleteAlbum(albumId: string): Promise<void> {
        await apiClient.delete(`/albums/${albumId}`)
    },

    // POST /api/albums/:id/media - Add media to album (with file)
    async addAlbumMedia(albumId: string, file: File): Promise<void> {
        const formData = new FormData()
        formData.append('media', file)
        formData.append('mediaType', file.type.startsWith('video/') ? 'video' : 'image')
        await apiClient.post(`/albums/${albumId}/media`, formData, {
            headers: { 'Content-Type': undefined }
        })
    },

    // DELETE /api/albums/:id/media/:mediaId - Remove media from album  
    async removeAlbumMedia(albumId: string, mediaId: string): Promise<void> {
        await apiClient.delete(`/albums/${albumId}/media/${mediaId}`)
    },

    // ==========================================
    // Events
    // ==========================================

    // GET /api/events?all=true - Get all events (admin)
    async getAllEvents(page = 1, limit = 20): Promise<PaginatedResponse<EventItem>> {
        return apiClient.get(`/events?all=true&page=${page}&limit=${limit}`)
    },

    // GET /api/events/:id - Get event with albums
    async getEvent(eventId: string): Promise<EventDetail> {
        const response = await apiClient.get<{ success: boolean; event: EventDetail }>(`/events/${eventId}`)
        return response.event
    },

    // GET /api/events/:eventId/albums - Get albums for event
    async getEventAlbums(eventId: string, page = 1, limit = 20): Promise<PaginatedResponse<AlbumItem> & { event: { id: string; name: string; date: string } }> {
        return apiClient.get(`/events/${eventId}/albums?page=${page}&limit=${limit}`)
    },

    // POST /api/events - Create event
    async createEvent(data: {
        name: string
        date: string
        endDate?: string
        startTime?: string
        endTime?: string
        description?: string
        groupIds?: string[]
    }): Promise<void> {
        await apiClient.post('/events', data)
    },

    // PATCH /api/events/:id - Update event
    async updateEvent(eventId: string, data: {
        name?: string
        date?: string
        endDate?: string
        startTime?: string
        endTime?: string
        description?: string
        groupIds?: string[]
    }): Promise<void> {
        await apiClient.patch(`/events/${eventId}`, data)
    },

    // DELETE /api/events/:id - Delete event and all albums
    async deleteEvent(eventId: string): Promise<void> {
        await apiClient.delete(`/events/${eventId}`)
    },

    // ==========================================
    // SMS Templates
    // ==========================================

    // GET /api/sms-templates - Get all SMS templates
    async getSmsTemplates(): Promise<SmsTemplate[]> {
        const response = await apiClient.get<{ success: boolean; data: SmsTemplate[] }>('/sms-templates')
        return response.data
    },

    // PATCH /api/sms-templates/:key - Update template content
    async updateSmsTemplate(key: string, content: string): Promise<void> {
        await apiClient.patch(`/sms-templates/${key}`, { content })
    },

    // POST /api/sms-templates/:key/toggle - Toggle template active status
    async toggleSmsTemplate(key: string): Promise<{ isActive: boolean }> {
        const response = await apiClient.post<{ success: boolean; data: { isActive: boolean } }>(`/sms-templates/${key}/toggle`)
        return response.data
    },

    // GET /api/sms-templates/:key - Get single template by key
    async getSmsTemplate(key: string): Promise<SmsTemplate | null> {
        try {
            const response = await apiClient.get<{ success: boolean; data: SmsTemplate }>(`/sms-templates/${key}`)
            return response.data
        } catch {
            return null
        }
    },
}
