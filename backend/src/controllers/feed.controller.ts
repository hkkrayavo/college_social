import type { Request, Response } from 'express'
import { Op } from 'sequelize'
import { Event, Album, AlbumMedia, User, Like, Comment, Group } from '../models/index.js'
import { asyncHandler } from '../middleware/errorHandler.js'

interface AlbumWithMedia {
    id: string
    name: string
    photoCount: number
    photos: { id: string; url: string; mediaType: string }[]
}

interface FeedItem {
    id: string
    type: 'event'
    createdAt: Date
    creator: { id: string; name: string; profilePictureUrl?: string }
    eventData: {
        name: string
        date: string
        endDate?: string
        description?: string
        albumCount: number
        albums: AlbumWithMedia[]
    }
    likesCount: number
    commentsCount: number
    liked: boolean
}

// GET /api/feed - Get events feed (events with nested albums)
export const getFeed = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    // Get user's groups to filter content
    const currentUser = await User.findByPk(userId, {
        include: [{
            model: Group,
            as: 'groups',
            attributes: ['id'],
            through: { attributes: [] }
        }]
    })

    const userGroupIds = (currentUser as any)?.groups?.map((g: any) => g.id) || []

    // If user has no groups, return empty feed (or just public events if any)
    if (userGroupIds.length === 0) {
        return res.json({
            success: true,
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
        })
    }

    // Fetch Events with their albums and album photos
    const { count, rows: events } = await Event.findAndCountAll({
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'profilePictureUrl'] },
            {
                model: Album,
                as: 'albums',
                include: [
                    { model: AlbumMedia, as: 'media', limit: 4, attributes: ['id', 'mediaUrl', 'mediaType'] },
                ],
            },
            {
                model: Group,
                as: 'groups',
                where: { id: { [Op.in]: userGroupIds } },
                attributes: [],
                through: { attributes: [] }
            }
        ],
        order: [['date', 'DESC']],
        limit,
        offset,
        distinct: true,
    })

    const feedItems: FeedItem[] = []

    for (const event of events) {
        const likesCount = await Like.count({ where: { likeableType: 'event', likeableId: event.id } })
        const commentsCount = await Comment.count({ where: { commentableType: 'event', commentableId: event.id } })
        const liked = userId ? !!(await Like.findOne({ where: { userId, likeableType: 'event', likeableId: event.id } })) : false

        // Process albums with their photos
        const albums: AlbumWithMedia[] = await Promise.all(
            ((event as any).albums || []).map(async (album: any) => {
                const photoCount = await AlbumMedia.count({ where: { albumId: album.id } })
                return {
                    id: album.id,
                    name: album.name,
                    photoCount,
                    photos: (album.media || []).map((m: any) => ({
                        id: m.id,
                        url: m.mediaUrl,
                        mediaType: m.mediaType,
                    })),
                }
            })
        )

        feedItems.push({
            id: event.id,
            type: 'event',
            createdAt: event.createdAt,
            creator: {
                id: (event as any).creator?.id || '',
                name: (event as any).creator?.name || 'Unknown',
                profilePictureUrl: (event as any).creator?.profilePictureUrl,
            },
            eventData: {
                name: event.name,
                date: String(event.date),
                endDate: event.endDate ? String(event.endDate) : undefined,
                description: event.description || undefined,
                albumCount: albums.length,
                albums,
            },
            likesCount,
            commentsCount,
            liked,
        })
    }

    res.json({
        success: true,
        data: feedItems,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
        },
    })
})

// GET /api/feed/album/:albumId - Get album with all media for viewer
export const getAlbumDetail = asyncHandler(async (req: Request, res: Response) => {
    const { albumId } = req.params
    const userId = req.user?.id

    const album = await Album.findByPk(albumId, {
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'profilePictureUrl'] },
            { model: Event, as: 'event', attributes: ['id', 'name', 'date'] },
            { model: AlbumMedia, as: 'media', order: [['displayOrder', 'ASC']] },
        ],
    })

    if (!album) {
        return res.status(404).json({ success: false, message: 'Album not found' })
    }

    // Get album-level stats
    const likesCount = await Like.count({ where: { likeableType: 'album', likeableId: albumId } })
    const commentsCount = await Comment.count({ where: { commentableType: 'album', commentableId: albumId } })
    const liked = userId ? !!(await Like.findOne({ where: { userId, likeableType: 'album', likeableId: albumId } })) : false

    // Get stats for each media item
    const mediaWithStats = await Promise.all(
        ((album as any).media || []).map(async (m: { id: string; mediaUrl: string; mediaType: string; caption?: string }) => {
            const mediaLikes = await Like.count({ where: { likeableType: 'album_media', likeableId: m.id } })
            const mediaComments = await Comment.count({ where: { commentableType: 'album_media', commentableId: m.id } })
            const mediaLiked = userId ? !!(await Like.findOne({ where: { userId, likeableType: 'album_media', likeableId: m.id } })) : false

            return {
                id: m.id,
                url: m.mediaUrl,
                mediaType: m.mediaType,
                caption: m.caption,
                likesCount: mediaLikes,
                commentsCount: mediaComments,
                liked: mediaLiked,
            }
        })
    )

    res.json({
        success: true,
        album: {
            id: album.id,
            name: album.name,
            description: album.description,
            event: (album as any).event,
            creator: (album as any).creator,
            media: mediaWithStats,
            likesCount,
            commentsCount,
            liked,
        },
    })
})

// GET /api/feed/event/:eventId - Get single event with full details
export const getEventDetail = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params
    const userId = req.user?.id

    const event = await Event.findByPk(eventId, {
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name', 'profilePictureUrl'] },
            {
                model: Album,
                as: 'albums',
                include: [
                    { model: AlbumMedia, as: 'media', limit: 4, attributes: ['id', 'mediaUrl', 'mediaType'] },
                ],
            },
        ],
    })

    if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' })
    }

    const likesCount = await Like.count({ where: { likeableType: 'event', likeableId: eventId } })
    const commentsCount = await Comment.count({ where: { commentableType: 'event', commentableId: eventId } })
    const liked = userId ? !!(await Like.findOne({ where: { userId, likeableType: 'event', likeableId: eventId } })) : false

    // Process albums with photo counts
    const albums = await Promise.all(
        ((event as any).albums || []).map(async (album: any) => {
            const photoCount = await AlbumMedia.count({ where: { albumId: album.id } })
            return {
                id: album.id,
                name: album.name,
                photoCount,
                photos: (album.media || []).map((m: any) => ({
                    id: m.id,
                    url: m.mediaUrl,
                    mediaType: m.mediaType,
                })),
            }
        })
    )

    res.json({
        success: true,
        event: {
            id: event.id,
            name: event.name,
            date: String(event.date),
            endDate: event.endDate ? String(event.endDate) : undefined,
            startTime: event.startTime || undefined,
            endTime: event.endTime || undefined,
            description: event.description || undefined,
            creator: {
                id: (event as any).creator?.id || '',
                name: (event as any).creator?.name || 'Unknown',
                profilePictureUrl: (event as any).creator?.profilePictureUrl,
            },
            albums,
            likesCount,
            commentsCount,
            liked,
        },
    })
})

