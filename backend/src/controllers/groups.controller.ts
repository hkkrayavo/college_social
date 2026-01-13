import type { Request, Response } from 'express'
import { Op } from 'sequelize'
import { Group, GroupType, User, UserGroup } from '../models/index.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js'

// GET /api/groups - Get groups
// User: their groups only | Admin with ?all=true: all groups (paginated)
// Supports ?search=query for name filtering
export const getGroups = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    const userRoles = req.user?.roles || []
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin')
    const showAll = req.query.all === 'true'
    const searchQuery = req.query.search as string | undefined

    // Admin requesting all groups
    if (isAdmin && showAll) {
        const { page, limit, offset } = getPaginationParams(req)

        // Build where clause
        const whereClause: any = {}
        if (searchQuery && searchQuery.trim().length > 0) {
            whereClause.name = { [Op.like]: `%${searchQuery.trim()}%` }
        }

        const { count, rows } = await Group.findAndCountAll({
            where: whereClause,
            include: [
                { model: GroupType, as: 'groupType' },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
            ],
            order: [['name', 'ASC']],
            limit,
            offset,
        })

        const groups = rows.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            type: (group as any).groupType?.label || 'General',
            creator: (group as any).creator,
            createdAt: group.createdAt,
        }))

        return res.json({
            success: true,
            ...paginatedResponse(groups, count, { page, limit, offset }),
        })
    }

    // Regular user or admin without ?all - get user's groups
    const user = await User.findByPk(userId, {
        include: [{
            model: Group,
            as: 'groups',
            include: [{ model: GroupType, as: 'groupType' }]
        }],
    })

    const groups = (user as any)?.groups || []

    res.json({
        success: true,
        data: groups.map((group: any) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            type: group.groupType?.label || 'General',
            memberCount: 0,
        })),
    })
})

// POST /api/groups - Create group (Admin only)
export const createGroup = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, groupTypeId } = req.body
    const creatorId = req.user?.id

    if (!name) {
        throw createError('Group name is required', 400)
    }

    const group = await Group.create({
        name,
        description,
        groupTypeId,
        createdBy: creatorId!,
    })

    res.status(201).json({
        success: true,
        message: 'Group created successfully',
        group: {
            id: group.id,
            name: group.name,
            description: group.description,
        },
    })
})

// PATCH /api/groups/admin/:id - Update group
export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, description, groupTypeId } = req.body

    const group = await Group.findByPk(id)
    if (!group) {
        throw createError('Group not found', 404)
    }

    await group.update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(groupTypeId && { groupTypeId }),
    })

    res.json({
        success: true,
        message: 'Group updated successfully',
        group: {
            id: group.id,
            name: group.name,
            description: group.description,
        },
    })
})

// DELETE /api/groups/admin/:id - Delete group
export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const group = await Group.findByPk(id)
    if (!group) {
        throw createError('Group not found', 404)
    }

    await group.destroy()

    res.json({
        success: true,
        message: 'Group deleted successfully',
    })
})

// POST /api/groups/admin/:id/members - Add members to group
export const addGroupMembers = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { userIds } = req.body

    const group = await Group.findByPk(id)
    if (!group) {
        throw createError('Group not found', 404)
    }

    if (!userIds || !Array.isArray(userIds)) {
        throw createError('User IDs array is required', 400)
    }

    for (const userId of userIds) {
        await UserGroup.findOrCreate({
            where: { userId, groupId: id },
            defaults: { userId, groupId: id },
        })
    }

    res.json({
        success: true,
        message: `${userIds.length} members added to group`,
    })
})

// DELETE /api/groups/admin/:id/members/:userId - Remove member from group
export const removeGroupMember = asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params

    const membership = await UserGroup.findOne({
        where: { groupId: id, userId },
    })

    if (!membership) {
        throw createError('User is not a member of this group', 404)
    }

    await membership.destroy()

    res.json({
        success: true,
        message: 'Member removed from group',
    })
})

// GET /api/groups/admin/:id/members - Get group members
export const getGroupMembers = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const group = await Group.findByPk(id, {
        include: [{
            model: User,
            as: 'members',
            attributes: ['id', 'name', 'mobileNumber', 'email', 'profilePictureUrl'],
        }],
    })

    if (!group) {
        throw createError('Group not found', 404)
    }

    res.json({
        success: true,
        members: (group as any).members || [],
    })
})
// GET /api/groups/types - Get all group types
// Publicly accessible for now, but usually for forms
export const getGroupTypes = asyncHandler(async (_req: Request, res: Response) => {
    const types = await GroupType.findAll({
        attributes: ['id', 'label', 'description'],
        order: [['label', 'ASC']],
    })

    return res.json({
        success: true,
        data: types,
    })
})

// POST /api/groups/types - Create group type (Admin only)
export const createGroupType = asyncHandler(async (req: Request, res: Response) => {
    const { label, description } = req.body

    if (!label) {
        throw createError('Label is required', 400)
    }

    const groupType = await GroupType.create({
        label,
        description: description || null,
    })

    return res.status(201).json({
        success: true,
        message: 'Group type created successfully',
        data: {
            id: groupType.id,
            label: groupType.label,
            description: groupType.description,
        },
    })
})

// PATCH /api/groups/types/:id - Update group type (Admin only)
export const updateGroupType = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { label, description } = req.body

    const groupType = await GroupType.findByPk(id)
    if (!groupType) {
        throw createError('Group type not found', 404)
    }

    await groupType.update({
        ...(label && { label }),
        ...(description !== undefined && { description }),
    })

    return res.json({
        success: true,
        message: 'Group type updated successfully',
        data: {
            id: groupType.id,
            label: groupType.label,
            description: groupType.description,
        },
    })
})

// DELETE /api/groups/types/:id - Delete group type (Admin only)
export const deleteGroupType = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const groupType = await GroupType.findByPk(id)
    if (!groupType) {
        throw createError('Group type not found', 404)
    }

    // Check if any groups are using this type
    const groupsUsingType = await Group.count({ where: { groupTypeId: id } })
    if (groupsUsingType > 0) {
        throw createError(`Cannot delete: ${groupsUsingType} groups are using this type`, 400)
    }

    await groupType.destroy()

    return res.json({
        success: true,
        message: 'Group type deleted successfully',
    })
})
