import type { Request, Response } from 'express'
import { Album, AlbumMedia, AlbumGroup, User, Group, Event } from '../models/index.js'
import { sequelize } from '../config/database.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js'
import { storageService } from '../services/storageService.js'



const toAbsoluteUrl = (path: string | null): string | null => {
    if (!path) return null
    if (path.startsWith('http')) return path

    return path // S3 URLs are already absolute
}

// GET /api/events/:eventId/albums - Get albums for an event
export const getAlbumsByEvent = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params
    const { page, limit, offset } = getPaginationParams(req)
    const userRoles = req.user?.roles || []
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin')

    // Verify event exists
    const event = await Event.findByPk(eventId)
    if (!event) {
        throw createError('Event not found', 404)
    }

    // Build query - admins see all, users see only albums shared with their groups
    const whereClause: any = { eventId }
    const includeGroups: any = { model: Group, as: 'groups', attributes: ['id', 'name'] }

    if (!isAdmin) {
        // Get user's group IDs
        const userId = req.user?.id
        const userGroups = await sequelize.query(`
            SELECT group_id FROM user_groups WHERE user_id = :userId
        `, {
            replacements: { userId },
            type: 'SELECT',
        }) as { group_id: string }[]

        const userGroupIds = userGroups.map(g => g.group_id)

        if (userGroupIds.length === 0) {
            // User has no groups - return empty
            return res.json({
                success: true,
                event: { id: event.id, name: event.name, date: event.date },
                ...paginatedResponse([], 0, { page, limit, offset }),
            })
        }

        // Filter albums by user's groups
        includeGroups.where = { id: userGroupIds }
        includeGroups.required = true // Only albums that have at least one of user's groups
    }

    const { count, rows } = await Album.findAndCountAll({
        where: whereClause,
        attributes: {
            include: [
                [
                    sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM album_media AS am
                        WHERE am.album_id = Album.id
                    )`),
                    'mediaCount'
                ]
            ]
        },
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: AlbumMedia, as: 'media', limit: 1 }, // Cover image
            includeGroups,
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
        subQuery: false,
    })

    const albums = rows.map(album => ({
        id: album.id,
        name: album.name,
        eventId: album.eventId,
        description: album.description,
        creator: (album as any).creator,
        coverImage: toAbsoluteUrl((album as any).media?.[0]?.mediaUrl),
        mediaCount: (album as any).dataValues.mediaCount || 0,
        groups: (album as any).groups || [],
        createdAt: album.createdAt,
    }))

    res.json({
        success: true,
        event: {
            id: event.id,
            name: event.name,
            date: event.date,
        },
        ...paginatedResponse(albums, count, { page, limit, offset }),
    })
})

// GET /api/albums/:id - Get album details with media
export const getAlbumById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const album = await Album.findByPk(id, {
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: AlbumMedia, as: 'media', order: [['displayOrder', 'ASC']] },
            { model: Group, as: 'groups', attributes: ['id', 'name'] },
            { model: Event, as: 'event' },
        ],
    })

    if (!album) {
        throw createError('Album not found', 404)
    }

    res.json({
        success: true,
        album: {
            id: album.id,
            name: album.name,
            eventId: album.eventId,
            event: (album as any).event ? {
                id: (album as any).event.id,
                name: (album as any).event.name,
                date: (album as any).event.date,
            } : null,
            description: album.description,
            creator: (album as any).creator,
            media: ((album as any).media || []).map((m: any) => ({
                ...m.toJSON(),
                mediaUrl: toAbsoluteUrl(m.mediaUrl)
            })),
            groups: (album as any).groups || [],
            createdAt: album.createdAt,
        },
    })
})

// POST /api/events/:eventId/albums - Create album within an event (Admin only)
export const createAlbum = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params
    const { name, description, groupIds } = req.body
    const creatorId = req.user?.id

    // Verify event exists
    const event = await Event.findByPk(eventId)
    if (!event) {
        throw createError('Event not found', 404)
    }

    if (!name) {
        throw createError('Album name is required', 400)
    }

    const album = await Album.create({
        name,
        eventId,
        description,
        createdBy: creatorId!,
    })

    // Link to groups
    if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
        for (const groupId of groupIds) {
            await AlbumGroup.create({
                albumId: album.id,
                groupId,
            })
        }
    }

    res.status(201).json({
        success: true,
        message: 'Album created successfully',
        album: {
            id: album.id,
            name: album.name,
            eventId: album.eventId,
        },
    })
})

// PATCH /api/albums/:id - Update album (Admin only)
export const updateAlbum = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, description, groupIds } = req.body

    const album = await Album.findByPk(id)
    if (!album) {
        throw createError('Album not found', 404)
    }

    await album.update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
    })

    // Update group assignments
    if (groupIds && Array.isArray(groupIds)) {
        await AlbumGroup.destroy({ where: { albumId: id } })
        for (const groupId of groupIds) {
            await AlbumGroup.create({ albumId: id, groupId })
        }
    }

    res.json({
        success: true,
        message: 'Album updated successfully',
    })
})

// DELETE /api/albums/:id - Delete album (Admin only)
export const deleteAlbum = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const album = await Album.findByPk(id)
    if (!album) {
        throw createError('Album not found', 404)
    }

    // Delete associated media files from disk
    const mediaItems = await AlbumMedia.findAll({ where: { albumId: id } })
    for (const media of mediaItems) {
        if (media.mediaUrl) {
            await storageService.deleteFile(media.mediaUrl)
        }
    }

    // Delete associated media and group links
    await AlbumMedia.destroy({ where: { albumId: id } })
    await AlbumGroup.destroy({ where: { albumId: id } })
    await album.destroy()

    res.json({
        success: true,
        message: 'Album deleted successfully',
    })
})

// POST /api/albums/:id/media - Add media to album (Admin only)
export const addAlbumMedia = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const file = req.file
    const { mediaType, caption } = req.body

    const album = await Album.findByPk(id)
    if (!album) {
        throw createError('Album not found', 404)
    }

    if (!file) {
        throw createError('Media file is required', 400)
    }

    const detectedMediaType: 'image' | 'video' = file.mimetype.startsWith('video/') ? 'video' : 'image'

    const mediaUrl = await storageService.uploadFile(file, 'albums', id)

    const mediaCount = await AlbumMedia.count({ where: { albumId: id } })

    const media = await AlbumMedia.create({
        albumId: id,
        mediaUrl,
        mediaType: mediaType || detectedMediaType,
        caption,
        displayOrder: mediaCount,
    })

    res.status(201).json({
        success: true,
        message: 'Media added to album',
        media: {
            id: media.id,
            mediaUrl: toAbsoluteUrl(media.mediaUrl)!,
            mediaType: media.mediaType,
        },
    })
})

// DELETE /api/albums/:id/media/:mediaId - Remove media from album (Admin only)
export const removeAlbumMedia = asyncHandler(async (req: Request, res: Response) => {
    const { id, mediaId } = req.params

    const media = await AlbumMedia.findOne({
        where: { id: mediaId, albumId: id },
    })

    if (!media) {
        throw createError('Media not found', 404)
    }

    if (media.mediaUrl) {
        await storageService.deleteFile(media.mediaUrl)
    }

    await media.destroy()

    res.json({
        success: true,
        message: 'Media removed from album',
    })
})
