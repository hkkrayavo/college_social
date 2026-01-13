import type { Request, Response } from 'express'
import { Event, Album, AlbumMedia, AlbumGroup, User, Group, EventGroup } from '../models/index.js'
import { sequelize } from '../config/database.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js'

// GET /api/events - Get all events
// Admin with ?all=true: all events | User: events with albums they can see
export const getEvents = asyncHandler(async (req: Request, res: Response) => {
    const userRoles = req.user?.roles || []
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin')
    const showAll = req.query.all === 'true'
    const { page, limit, offset } = getPaginationParams(req)

    if (isAdmin && showAll) {
        // Admin: get all events with album count
        const { count, rows } = await Event.findAndCountAll({
            attributes: {
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM albums AS a
                            WHERE a.event_id = Event.id
                        )`),
                        'albumCount'
                    ]
                ]
            },
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: Group, as: 'groups', attributes: ['id', 'name'] },
            ],
            order: [['date', 'DESC']],
            limit,
            offset,
            distinct: true,
        })

        const events = rows.map(event => ({
            id: event.id,
            name: event.name,
            date: event.date,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
            description: event.description,
            creator: (event as any).creator,
            groups: (event as any).groups || [],
            albumCount: (event as any).dataValues.albumCount || 0,
            createdAt: event.createdAt,
        }))

        return res.json({
            success: true,
            ...paginatedResponse(events, count, { page, limit, offset }),
        })
    }

    // User: get events that are shared with groups the user belongs to
    const userId = req.user?.id

    // Get user's group IDs
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
            ...paginatedResponse([], 0, { page, limit, offset }),
        })
    }

    // Get events that are shared with the user's groups
    const { count, rows } = await Event.findAndCountAll({
        attributes: {
            include: [
                [
                    sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM albums AS a
                        INNER JOIN album_groups AS ag ON ag.album_id = a.id
                        WHERE a.event_id = Event.id
                        AND ag.group_id IN (${userGroupIds.map(id => `'${id}'`).join(',')})
                    )`),
                    'albumCount'
                ]
            ]
        },
        include: [
            {
                model: Group,
                as: 'groups',
                attributes: ['id', 'name'],
                where: { id: userGroupIds },
                required: true, // Only events that have at least one of user's groups
            },
        ],
        order: [['date', 'DESC']],
        limit,
        offset,
        distinct: true,
        subQuery: false,
    })

    const events = rows.map(event => ({
        id: event.id,
        name: event.name,
        date: event.date,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description,
        albumCount: (event as any).dataValues.albumCount || 0,
        createdAt: event.createdAt,
    }))

    res.json({
        success: true,
        ...paginatedResponse(events, count, { page, limit, offset }),
    })
})

// GET /api/events/:id - Get event with its albums
export const getEventById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const event = await Event.findByPk(id, {
        include: [
            { model: User, as: 'creator', attributes: ['id', 'name'] },
            { model: Group, as: 'groups', attributes: ['id', 'name'] },
            {
                model: Album,
                as: 'albums',
                include: [
                    { model: Group, as: 'groups', attributes: ['id', 'name'] },
                    { model: AlbumMedia, as: 'media', limit: 1 }, // Cover image
                ],
            },
        ],
    })

    if (!event) {
        throw createError('Event not found', 404)
    }

    res.json({
        success: true,
        event: {
            id: event.id,
            name: event.name,
            date: event.date,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
            description: event.description,
            creator: (event as any).creator,
            groups: (event as any).groups || [],
            albums: ((event as any).albums || []).map((album: any) => ({
                id: album.id,
                name: album.name,
                description: album.description,
                coverImage: album.media?.[0]?.mediaUrl || null,
                mediaCount: album.media?.length || 0,
                groups: album.groups || [],
            })),
            createdAt: event.createdAt,
        },
    })
})

// POST /api/events - Create event (Admin only)
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
    const { name, date, endDate, startTime, endTime, description, groupIds } = req.body
    const creatorId = req.user?.id

    if (!name || !date) {
        throw createError('Event name and date are required', 400)
    }

    const event = await Event.create({
        name,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        description,
        createdBy: creatorId!,
    })

    // Link to groups
    if (groupIds && Array.isArray(groupIds) && groupIds.length > 0) {
        for (const groupId of groupIds) {
            await EventGroup.create({
                eventId: event.id,
                groupId,
            })
        }
    }

    res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event: {
            id: event.id,
            name: event.name,
            date: event.date,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
        },
    })
})

// PATCH /api/events/:id - Update event (Admin only)
export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, date, endDate, startTime, endTime, description, groupIds } = req.body

    const event = await Event.findByPk(id)
    if (!event) {
        throw createError('Event not found', 404)
    }

    await event.update({
        ...(name && { name }),
        ...(date && { date: new Date(date) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(description !== undefined && { description }),
    })

    // Update group assignments
    if (groupIds && Array.isArray(groupIds)) {
        await EventGroup.destroy({ where: { eventId: id } })
        for (const groupId of groupIds) {
            await EventGroup.create({ eventId: id, groupId })
        }
    }

    res.json({
        success: true,
        message: 'Event updated successfully',
    })
})

// DELETE /api/events/:id - Delete event and all its albums (Admin only)
export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const event = await Event.findByPk(id, {
        include: [{ model: Album, as: 'albums' }],
    })

    if (!event) {
        throw createError('Event not found', 404)
    }

    // Delete all albums and their media for this event
    const albums = (event as any).albums || []
    for (const album of albums) {
        await AlbumMedia.destroy({ where: { albumId: album.id } })
        await AlbumGroup.destroy({ where: { albumId: album.id } })
        await Album.destroy({ where: { id: album.id } })
    }

    await event.destroy()

    res.json({
        success: true,
        message: 'Event and all its albums deleted successfully',
    })
})
