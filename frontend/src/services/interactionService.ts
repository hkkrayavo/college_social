import { apiClient } from './api'

export type InteractionType = 'posts' | 'events' | 'albums' | 'media'

interface LikeResponse {
    success: boolean
    liked: boolean
    likesCount: number
}

interface CommentItem {
    id: string
    content: string
    author: {
        id: string
        name: string
        profilePictureUrl?: string
    }
    createdAt: string
}

interface CommentsResponse {
    success: boolean
    comments: CommentItem[]
}

export const interactionService = {
    // Likes
    async like(type: InteractionType, id: string): Promise<LikeResponse> {
        return apiClient.post(`/${type}/${id}/like`, {})
    },

    async unlike(type: InteractionType, id: string): Promise<LikeResponse> {
        return apiClient.delete(`/${type}/${id}/like`)
    },

    async getLikes(type: InteractionType, id: string): Promise<LikeResponse> {
        return apiClient.get(`/${type}/${id}/likes`)
    },

    // Comments
    async getComments(type: InteractionType, id: string): Promise<CommentsResponse> {
        return apiClient.get(`/${type}/${id}/comments`)
    },

    async addComment(type: InteractionType, id: string, content: string): Promise<{ success: boolean; comment: CommentItem }> {
        return apiClient.post(`/${type}/${id}/comments`, { content })
    },

    async deleteComment(commentId: string): Promise<void> {
        await apiClient.delete(`/comments/${commentId}`)
    },
}

export type { CommentItem }
