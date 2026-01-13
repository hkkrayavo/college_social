import { apiClient } from './api'

export interface FeedCreator {
    id: string
    name: string
    profilePictureUrl?: string
    avatar?: string
}

export interface AlbumWithMedia {
    id: string
    name: string
    photoCount: number
    photos: { id: string; url: string; mediaType: string }[]
}

export interface FeedEventData {
    name: string
    date: string
    endDate?: string
    description?: string
    albumCount: number
    albums: AlbumWithMedia[]
}

export interface FeedItem {
    id: string
    type: 'event'
    createdAt: string
    creator: FeedCreator
    eventData: FeedEventData
    likesCount: number
    commentsCount: number
    liked: boolean
}

export interface FeedResponse {
    success: boolean
    data: FeedItem[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface AlbumMedia {
    id: string
    url: string
    mediaType: string
    caption?: string
    likesCount: number
    commentsCount: number
    liked: boolean
}

export interface AlbumDetail {
    id: string
    name: string
    description?: string
    event: { id: string; name: string; date: string }
    creator: FeedCreator
    media: AlbumMedia[]
    likesCount: number
    commentsCount: number
    liked: boolean
}

export const feedService = {
    async getFeed(page = 1, limit = 10): Promise<FeedResponse> {
        return apiClient.get(`/feed?page=${page}&limit=${limit}`)
    },

    async getAlbumDetail(albumId: string): Promise<{ success: boolean; album: AlbumDetail }> {
        return apiClient.get(`/feed/album/${albumId}`)
    },
}

