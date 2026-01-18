import type { Request, Response } from 'express'
import { Like, Comment, User, Event, Album, AlbumMedia, Post } from '../models/index.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import type { LikeableType } from '../models/Like.js'
import type { CommentableType } from '../models/Comment.js'

// Valid entity types for interactions
const VALID_TYPES = ['posts', 'events', 'albums', 'media'] as const
type EntityType = typeof VALID_TYPES[number]

// Map URL type to database type
const typeMap: Record<EntityType, LikeableType> = {
    posts: 'post',
    events: 'event',
    albums: 'album',
    media: 'album_media',
}

// Validate entity exists
async function validateEntity(type: EntityType, id: string): Promise<boolean> {
    switch (type) {
        case 'posts':
            return !!(await Post.findByPk(id))
        case 'events':
            return !!(await Event.findByPk(id))
        case 'albums':
            return !!(await Album.findByPk(id))
        case 'media':
            return !!(await AlbumMedia.findByPk(id))
        default:
            return false
    }
}

// ==========================================
// LIKES
// ==========================================

// POST /api/:type/:id/like - Add like
export const addLike = asyncHandler(async (req: Request, res: Response) => {
    const { type, id } = req.params
    const userId = req.user!.id

    if (!VALID_TYPES.includes(type as EntityType)) {
        throw createError('Invalid entity type', 400)
    }

    const entityType = type as EntityType
    const exists = await validateEntity(entityType, id)
    if (!exists) {
        throw createError('Entity not found', 404)
    }

    const likeableType = typeMap[entityType]

    // Check if already liked
    const existing = await Like.findOne({
        where: { userId, likeableType, likeableId: id }
    })

    if (existing) {
        const count = await Like.count({ where: { likeableType, likeableId: id } })
        return res.json({ success: true, message: 'Already liked', liked: true, likesCount: count })
    }

    await Like.create({
        userId,
        likeableType,
        likeableId: id,
    })

    // Get updated count
    const count = await Like.count({ where: { likeableType, likeableId: id } })

    res.status(201).json({
        success: true,
        message: 'Liked successfully',
        liked: true,
        likesCount: count,
    })
})

// DELETE /api/:type/:id/like - Remove like
export const removeLike = asyncHandler(async (req: Request, res: Response) => {
    const { type, id } = req.params
    const userId = req.user!.id

    if (!VALID_TYPES.includes(type as EntityType)) {
        throw createError('Invalid entity type', 400)
    }

    const entityType = type as EntityType
    const likeableType = typeMap[entityType]

    const like = await Like.findOne({
        where: { userId, likeableType, likeableId: id }
    })

    if (!like) {
        const count = await Like.count({ where: { likeableType, likeableId: id } })
        return res.json({ success: true, message: 'Not liked', liked: false, likesCount: count })
    }

    await like.destroy()

    const count = await Like.count({ where: { likeableType, likeableId: id } })

    res.json({
        success: true,
        message: 'Like removed',
        liked: false,
        likesCount: count,
    })
})

// GET /api/:type/:id/likes - Get like status, count, and likers list
export const getLikes = asyncHandler(async (req: Request, res: Response) => {
    const { type, id } = req.params
    const userId = req.user?.id

    if (!VALID_TYPES.includes(type as EntityType)) {
        throw createError('Invalid entity type', 400)
    }

    const entityType = type as EntityType
    const likeableType = typeMap[entityType]

    // Get likes with user details
    const likes = await Like.findAll({
        where: { likeableType, likeableId: id },
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'profilePictureUrl']
        }],
        order: [['createdAt', 'DESC']],
        limit: 50, // Limit for performance
    })

    const count = likes.length

    let liked = false
    if (userId) {
        liked = likes.some(like => like.userId === userId)
    }

    res.json({
        success: true,
        likesCount: count,
        liked,
        users: likes.map(like => ({
            id: (like as any).user?.id,
            name: (like as any).user?.name,
            profilePictureUrl: (like as any).user?.profilePictureUrl,
        })),
    })
})

// ==========================================
// COMMENTS
// ==========================================

// GET /api/:type/:id/comments - Get comments
export const getComments = asyncHandler(async (req: Request, res: Response) => {
    const { type, id } = req.params

    if (!VALID_TYPES.includes(type as EntityType)) {
        throw createError('Invalid entity type', 400)
    }

    const entityType = type as EntityType
    const commentableType = typeMap[entityType] as CommentableType

    const comments = await Comment.findAll({
        where: { commentableType, commentableId: id },
        include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']],
    })

    res.json({
        success: true,
        comments: comments.map(c => ({
            id: c.id,
            content: c.content,
            author: (c as any).author,
            createdAt: c.createdAt,
        })),
    })
})

// POST /api/:type/:id/comments - Add comment
export const addComment = asyncHandler(async (req: Request, res: Response) => {
    const { type, id } = req.params
    const { content } = req.body
    const userId = req.user!.id

    if (!content || content.trim().length === 0) {
        throw createError('Comment content is required', 400)
    }

    if (!VALID_TYPES.includes(type as EntityType)) {
        throw createError('Invalid entity type', 400)
    }

    const entityType = type as EntityType
    const exists = await validateEntity(entityType, id)
    if (!exists) {
        throw createError('Entity not found', 404)
    }

    const commentableType = typeMap[entityType] as CommentableType

    const comment = await Comment.create({
        userId,
        commentableType,
        commentableId: id,
        content: content.trim(),
    })

    // Fetch with author
    const fullComment = await Comment.findByPk(comment.id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
    })

    res.status(201).json({
        success: true,
        message: 'Comment added',
        comment: {
            id: fullComment!.id,
            content: fullComment!.content,
            author: (fullComment as any).author,
            createdAt: fullComment!.createdAt,
        },
    })
})

// DELETE /api/comments/:id - Delete comment
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user!.id
    const userRoles = req.user?.roles || []
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin')

    const comment = await Comment.findByPk(id)
    if (!comment) {
        throw createError('Comment not found', 404)
    }

    // Only author or admin can delete
    if (comment.userId !== userId && !isAdmin) {
        throw createError('Not authorized to delete this comment', 403)
    }

    await comment.destroy()

    res.json({
        success: true,
        message: 'Comment deleted',
    })
})
