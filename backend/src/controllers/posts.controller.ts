import type { Request, Response } from 'express'
import { Op, literal } from 'sequelize'
import { User, Group, Post, PostMedia, PostGroup, Like, Comment, UserGroup } from '../models/index.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js'
import { storageService } from '../services/storageService.js'

// GET /api/posts - Get posts
// Query params: ?mine=true (user's posts) | ?status=pending (admin: pending posts)
// Default: user's feed (approved posts)
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    const userRoles = req.user?.roles || []
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin')
    const { page, limit, offset } = getPaginationParams(req)

    const { mine, status } = req.query

    // User's own posts
    if (mine === 'true') {
        const { count, rows } = await Post.findAndCountAll({
            where: { authorId: userId },
            include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'profilePictureUrl'] },
                { model: PostMedia, as: 'media' },
                { model: Group, as: 'groups', attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true,
        })

        const posts = await Promise.all(rows.map(async (post) => {
            const likesCount = await Like.count({ where: { likeableType: 'post', likeableId: post.id } })
            const commentsCount = await Comment.count({ where: { commentableType: 'post', commentableId: post.id } })

            return {
                id: post.id,
                title: post.title,
                content: post.content,
                status: post.status,
                author: (post as any).author,
                media: (post as any).media || [],
                groups: (post as any).groups || [],
                likesCount,
                commentsCount,
                createdAt: post.createdAt,
            }
        }))

        return res.json({
            success: true,
            ...paginatedResponse(posts, count, { page, limit, offset }),
        })
    }

    // Admin: View all posts or filter by status
    if (isAdmin && (status || req.query.all === 'true')) {
        const where: any = {}
        if (status && status !== 'all') {
            if ((status as string).includes(',')) {
                where.status = { [Op.in]: (status as string).split(',') }
            } else {
                where.status = status
            }
        }

        const { count, rows } = await Post.findAndCountAll({
            where,
            include: [
                { model: User, as: 'author', attributes: ['id', 'name', 'mobileNumber', 'profilePictureUrl'] },
                { model: PostMedia, as: 'media' },
                { model: Group, as: 'groups', attributes: ['id', 'name'] },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            distinct: true,
        })

        const posts = await Promise.all(rows.map(async (post) => {
            const likesCount = await Like.count({ where: { likeableType: 'post', likeableId: post.id } })
            const commentsCount = await Comment.count({ where: { commentableType: 'post', commentableId: post.id } })

            return {
                id: post.id,
                title: post.title,
                content: post.content,
                status: post.status,
                author: (post as any).author,
                media: (post as any).media || [],
                groups: (post as any).groups || [],
                likesCount,
                commentsCount,
                createdAt: post.createdAt,
            }
        }))

        return res.json({
            success: true,
            ...paginatedResponse(posts, count, { page, limit, offset }),
        })
    }

    // Default: user's feed (approved posts + public/group visibility)

    // Get user's groups to filter visibility
    const userGroups = await UserGroup.findAll({
        where: { userId },
        attributes: ['groupId'],
    })
    const groupIds = userGroups.map(ug => ug.groupId)

    const whereClause: any = {
        status: 'approved',
        [Op.and]: []
    }

    if (groupIds.length > 0) {
        // If user is in groups, see Public posts OR Group posts they belong to
        whereClause[Op.and].push({
            [Op.or]: [
                { isPublic: true },
                literal(`EXISTS (SELECT 1 FROM post_groups pg WHERE pg.post_id = Post.id AND pg.group_id IN (${groupIds.map(id => `'${id}'`).join(',')}))`)
            ]
        })
    } else {
        // If user is in no groups, ONLY see Public posts
        whereClause.isPublic = true
    }

    const { count, rows } = await Post.findAndCountAll({
        where: whereClause,
        include: [
            { model: User, as: 'author', attributes: ['id', 'name', 'profilePictureUrl'] },
            { model: PostMedia, as: 'media' },
            { model: Group, as: 'groups', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        distinct: true,
    })

    // Get likes and comments counts for each post
    const posts = await Promise.all(rows.map(async (post) => {
        const likesCount = await Like.count({
            where: { likeableType: 'post', likeableId: post.id },
        })
        const commentsCount = await Comment.count({
            where: { commentableType: 'post', commentableId: post.id },
        })
        return {
            id: post.id,
            title: post.title,
            content: post.content,
            status: post.status,
            author: (post as any).author,
            media: (post as any).media || [],
            groups: (post as any).groups || [],
            likesCount,
            commentsCount,
            createdAt: post.createdAt,
        }
    }))

    res.json({
        success: true,
        ...paginatedResponse(posts, count, { page, limit, offset }),
    })
})

// GET /api/posts/:id - Get single post by ID
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user?.id

    const post = await Post.findByPk(id, {
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'profilePictureUrl'],
            },
            { model: PostMedia, as: 'media' },
            { model: Group, as: 'groups', attributes: ['id', 'name'] },
        ],
    })

    if (!post) {
        throw createError('Post not found', 404)
    }

    // Only allow viewing approved posts (unless it's the author or admin)
    const userRoles = req.user?.roles || []
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin')
    const isAuthor = post.authorId === userId

    if (post.status !== 'approved' && !isAdmin && !isAuthor) {
        throw createError('Post not found', 404)
    }

    const likesCount = await Like.count({ where: { likeableType: 'post', likeableId: id } })
    const commentsCount = await Comment.count({ where: { commentableType: 'post', commentableId: id } })

    const response = {
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status,
        author: (post as any).author,
        media: (post as any).media || [],
        groups: (post as any).groups || [],
        likesCount,
        commentsCount,
        createdAt: post.createdAt,
    }

    res.json({
        success: true,
        data: response,
    })
})

// POST /api/posts - Create a post
export const createPost = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    let { title, content, groupIds, isPublic } = req.body

    // Auto-set visibility:
    // - If groups usually Private (false) unless explicitly Public
    // - If no groups, usually Public (true)
    if (isPublic === undefined) {
        isPublic = !groupIds || groupIds.length === 0
    }

    // Content is Editor.js JSON - store as string
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content)

    if (!contentStr || contentStr.trim().length === 0) {
        throw createError('Post content is required', 400)
    }

    // All posts go to pending - admin assigns groups during approval
    const post = await Post.create({
        title: title || null,
        content: contentStr,
        authorId: userId!,
        isPublic,
        status: 'pending',
    })

    // Link to groups
    if (groupIds && Array.isArray(groupIds)) {
        for (const groupId of groupIds) {
            await PostGroup.create({
                postId: post.id,
                groupId,
            })
        }
    }

    res.status(201).json({
        success: true,
        message: 'Post submitted for approval',
        post: {
            id: post.id,
            title: post.title,
            content: post.content,
            status: post.status,
        },
    })
})

// PATCH /api/posts/:id/status - Update post status (Admin only)
// Body: { status: 'approved' | 'rejected', reason?: string, groupIds?: string[] }
export const updatePostStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { status, reason, groupIds } = req.body
    const reviewerId = req.user?.id

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        throw createError('Valid status is required (approved, rejected, pending)', 400)
    }

    const post = await Post.findByPk(id)
    if (!post) {
        throw createError('Post not found', 404)
    }

    await post.update({
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        ...(reason && status === 'rejected' ? { rejectionReason: reason } : {}),
    })

    // If approving, optionally assign to groups
    if (status === 'approved' && groupIds && Array.isArray(groupIds)) {
        // Remove existing group assignments
        await PostGroup.destroy({ where: { postId: id } })
        // Add new group assignments
        for (const groupId of groupIds) {
            await PostGroup.create({ postId: id, groupId })
        }
    }

    const message = status === 'approved'
        ? 'Post approved'
        : status === 'rejected'
            ? 'Post rejected'
            : 'Post status updated'

    res.json({
        success: true,
        message,
    })
})

// DELETE /api/posts/:id - Delete post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user?.id
    const userRoles = req.user?.roles || []
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin')

    const post = await Post.findByPk(id)
    if (!post) {
        throw createError('Post not found', 404)
    }

    // Admins can delete any post, users can only delete their own
    if (!isAdmin && post.authorId !== userId) {
        throw createError('You can only delete your own posts', 403)
    }

    await post.destroy()

    res.json({
        success: true,
        message: 'Post deleted',
    })
})

// POST /api/posts/upload-media - Upload media for Editor.js
export const uploadPostMedia = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file
    const userId = req.user?.id

    if (!file) {
        return res.status(400).json({
            success: 0,
            message: 'No file uploaded'
        })
    }

    if (!userId) {
        return res.status(401).json({
            success: 0,
            message: 'Unauthorized'
        })
    }

    try {
        // Upload to Spaces: posts/{userId}/filename
        const fileUrl = await storageService.uploadFile(file, 'posts', userId)

        // Return format expected by Editor.js Image tool
        res.json({
            success: 1,
            file: {
                url: fileUrl,
            },
        })
    } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({
            success: 0,
            message: 'Failed to save file'
        })
    }
})

// ==========================================
// Likes
// ==========================================

// POST /api/posts/:id/like - Like a post
export const likePost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
        throw createError('Unauthorized', 401)
    }

    // Check if post exists
    const post = await Post.findByPk(id)
    if (!post) {
        throw createError('Post not found', 404)
    }

    // Check if already liked
    const existingLike = await Like.findOne({
        where: {
            userId,
            likeableType: 'post',
            likeableId: id,
        },
    })

    if (existingLike) {
        return res.json({
            success: true,
            message: 'Post already liked',
            liked: true,
        })
    }

    // Create like
    await Like.create({
        userId,
        likeableType: 'post',
        likeableId: id,
    })

    // Get updated like count
    const likesCount = await Like.count({
        where: {
            likeableType: 'post',
            likeableId: id,
        },
    })

    res.json({
        success: true,
        message: 'Post liked',
        liked: true,
        likesCount,
    })
})

// DELETE /api/posts/:id/like - Unlike a post
export const unlikePost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
        throw createError('Unauthorized', 401)
    }

    // Delete like
    const deleted = await Like.destroy({
        where: {
            userId,
            likeableType: 'post',
            likeableId: id,
        },
    })

    // Get updated like count
    const likesCount = await Like.count({
        where: {
            likeableType: 'post',
            likeableId: id,
        },
    })

    res.json({
        success: true,
        message: deleted ? 'Post unliked' : 'Like not found',
        liked: false,
        likesCount,
    })
})

// ==========================================
// Comments
// ==========================================

// GET /api/posts/:id/comments - Get post comments
export const getPostComments = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    // Check if post exists
    const post = await Post.findByPk(id)
    if (!post) {
        throw createError('Post not found', 404)
    }

    const comments = await Comment.findAll({
        where: { commentableType: 'post', commentableId: id },
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'profilePictureUrl'],
            },
        ],
        order: [['createdAt', 'DESC']],
    })

    res.json({
        success: true,
        comments: comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            author: (comment as any).author,
            createdAt: comment.createdAt,
        })),
    })
})

// POST /api/posts/:id/comments - Add a comment
export const addComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const userId = req.user?.id
    const { content } = req.body

    if (!userId) {
        throw createError('Unauthorized', 401)
    }

    if (!content || !content.trim()) {
        throw createError('Comment content is required', 400)
    }

    // Check if post exists
    const post = await Post.findByPk(id)
    if (!post) {
        throw createError('Post not found', 404)
    }

    // Create comment
    const comment = await Comment.create({
        commentableType: 'post',
        commentableId: id,
        userId,
        content: content.trim(),
    })

    // Get comment with author
    const commentWithAuthor = await Comment.findByPk(comment.id, {
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'name', 'profilePictureUrl'],
            },
        ],
    })

    // Get updated comment count
    const commentsCount = await Comment.count({
        where: { commentableType: 'post', commentableId: id },
    })

    res.status(201).json({
        success: true,
        message: 'Comment added',
        comment: {
            id: comment.id,
            content: comment.content,
            author: (commentWithAuthor as any)?.author,
            createdAt: comment.createdAt,
        },
        commentsCount,
    })
})

// PATCH /api/posts/:postId/comments/:commentId - Update a comment
export const updateComment = asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params
    const userId = req.user?.id
    const { content } = req.body

    if (!userId) {
        throw createError('Unauthorized', 401)
    }

    if (!content || !content.trim()) {
        throw createError('Comment content is required', 400)
    }

    const comment = await Comment.findByPk(commentId)

    if (!comment) {
        throw createError('Comment not found', 404)
    }

    // Only the author can edit their comment
    if (comment.userId !== userId) {
        throw createError('You can only edit your own comments', 403)
    }

    // Update the comment
    comment.content = content.trim()
    await comment.save()

    res.json({
        success: true,
        message: 'Comment updated',
        data: {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
        },
    })
})

// DELETE /api/posts/:postId/comments/:commentId - Delete a comment
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { postId, commentId } = req.params
    const userId = req.user?.id
    const userRoles = req.user?.roles || []

    if (!userId) {
        throw createError('Unauthorized', 401)
    }

    const comment = await Comment.findByPk(commentId)

    if (!comment) {
        throw createError('Comment not found', 404)
    }

    // Only the author or admin can delete a comment
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin')
    if (comment.userId !== userId && !isAdmin) {
        throw createError('You can only delete your own comments', 403)
    }

    await comment.destroy()

    // Get updated comment count
    const commentsCount = await Comment.count({
        where: { commentableType: 'post', commentableId: postId },
    })

    res.json({
        success: true,
        message: 'Comment deleted',
        commentsCount,
    })
})
