import type { Request, Response } from 'express'
import { Op } from 'sequelize'
import { User, Role, UserRole, Group, Post, SiteSettings } from '../models/index.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { getPaginationParams, paginatedResponse } from '../utils/pagination.js'
import { smsService } from '../services/sms.service.js'

// GET /api/users/admin/pending - Get pending users
export const getPendingUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = getPaginationParams(req)

    const { count, rows } = await User.findAndCountAll({
        where: { status: 'pending' },
        include: [{ model: Role, as: 'roles' }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    })

    const users = rows.map(user => ({
        id: user.id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        role: (user as any).roles?.[0]?.name || 'user',
        profilePictureUrl: user.profilePictureUrl,
    }))

    res.json({
        success: true,
        ...paginatedResponse(users, count, { page, limit, offset }),
    })
})

// GET /api/users/admin - Get all users
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = getPaginationParams(req)
    const { status, search } = req.query

    const where: any = {}
    if (status && status !== 'all') {
        const statusStr = status as string
        if (statusStr.includes(',')) {
            where.status = { [Op.in]: statusStr.split(',') }
        } else {
            where.status = statusStr
        }
    }
    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { mobileNumber: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
        ]
    }

    const { count, rows } = await User.findAndCountAll({
        where,
        include: [{ model: Role, as: 'roles' }],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    })

    const users = rows.map(user => ({
        id: user.id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        role: (user as any).roles?.[0]?.name || 'user',
        profilePictureUrl: user.profilePictureUrl,
    }))

    res.json({
        success: true,
        ...paginatedResponse(users, count, { page, limit, offset }),
    })
})

// PATCH /api/users/:id/status - Update user status (approve/reject)
// Body: { status: 'approved' | 'rejected', reason?: string }
export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { status, reason } = req.body

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        throw createError('Valid status is required (approved, rejected, pending)', 400)
    }

    const user = await User.findByPk(id)
    if (!user) {
        throw createError('User not found', 404)
    }

    await user.update({
        status,
        ...(reason && status === 'rejected' ? { rejectionReason: reason } : {})
    })

    // Send SMS notification based on status
    if (status === 'approved') {
        // Use custom message if provided, otherwise use template
        if (reason) {
            await smsService.sendSms(user.mobileNumber, reason)
        } else {
            await smsService.sendTemplatedSms(user.mobileNumber, 'account_approved', {
                user_name: user.name,
                app_name: 'Alumni Portal'
            })
        }
    } else if (status === 'rejected' && reason) {
        await smsService.sendTemplatedSms(user.mobileNumber, 'account_rejected', {
            user_name: user.name,
            reason: reason
        })
    }

    const message = status === 'approved'
        ? 'User approved successfully'
        : status === 'rejected'
            ? 'User rejected'
            : 'User status updated'

    res.json({
        success: true,
        message,
        user: {
            id: user.id,
            name: user.name,
            status: user.status,
            profilePictureUrl: user.profilePictureUrl,
        },
    })
})

// PATCH /api/users/admin/:id - Update user details
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, email, role, status } = req.body

    const user = await User.findByPk(id, {
        include: [{ model: Role, as: 'roles' }],
    })

    if (!user) {
        throw createError('User not found', 404)
    }

    // Update user fields
    const updateData: any = {}
    if (name) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (status) updateData.status = status

    await user.update(updateData)

    // Update role if provided
    if (role) {
        const newRole = await Role.findOne({ where: { name: role } })
        if (newRole) {
            // Remove existing roles and assign new one
            await UserRole.destroy({ where: { userId: user.id } })
            await UserRole.create({
                userId: user.id,
                roleId: newRole.id,
                assignedBy: req.user?.id,
                assignedAt: new Date(),
            })
        } else {
            console.warn(`Role '${role}' not found in database. User role not updated.`)
        }
    }

    res.json({
        success: true,
        message: 'User updated successfully',
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status,
            profilePictureUrl: user.profilePictureUrl,
        },
    })
})

// DELETE /api/users/admin/:id - Soft delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const user = await User.findByPk(id)
    if (!user) {
        throw createError('User not found', 404)
    }

    await user.destroy() // Uses paranoid soft delete

    res.json({
        success: true,
        message: 'User deleted successfully',
    })
})

// GET /api/users/:id/groups - Get groups a user belongs to
export const getUserGroups = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const user = await User.findByPk(id, {
        include: [{ model: Group, as: 'groups', attributes: ['id', 'name', 'description'] }],
    })

    if (!user) {
        throw createError('User not found', 404)
    }

    res.json({
        success: true,
        groups: (user as any).groups || [],
    })
})

// POST /api/users/admin - Create user (auto-approved)
export const createUserByAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { name, mobileNumber, email, role = 'user' } = req.body

    if (!name || !mobileNumber) {
        throw createError('Name and mobile number are required', 400)
    }

    const existingUser = await User.findOne({ where: { mobileNumber } })
    if (existingUser) {
        throw createError('User with this mobile number already exists', 409)
    }

    const user = await User.create({
        name,
        mobileNumber,
        email,
        status: 'approved', // Auto-approved when created by admin
        createdByAdmin: true,
    })

    // Assign role
    const userRole = await Role.findOne({ where: { name: role } })
    if (userRole) {
        await UserRole.create({
            userId: user.id,
            roleId: userRole.id,
            assignedBy: req.user?.id,
            assignedAt: new Date(),
        })
    } else {
        console.warn(`Role '${role}' not found in database. User created without role.`)
    }

    res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
            id: user.id,
            name: user.name,
            mobileNumber: user.mobileNumber,
            email: user.email,
            status: user.status,
            profilePictureUrl: user.profilePictureUrl,
        },
    })
})

// GET /api/admin/dashboard/stats - Get dashboard statistics
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
    const [pendingUsers, totalUsers, pendingPosts, totalGroups] = await Promise.all([
        User.count({ where: { status: 'pending' } }),
        User.count(),
        Post.count({ where: { status: 'pending' } }),
        Group.count(),
    ])

    res.json({
        success: true,
        stats: {
            pendingUsers,
            totalUsers,
            pendingPosts,
            totalGroups,
        },
    })
})

// GET /api/admin/settings/:key - Get a site setting
export const getSetting = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params

    const setting = await SiteSettings.findOne({ where: { key } })

    res.json({
        success: true,
        key,
        value: setting?.value || null,
    })
})

// PUT /api/admin/settings/:key - Update a site setting
export const updateSetting = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params
    const { value } = req.body

    if (value === undefined) {
        throw createError('Value is required', 400)
    }

    const [setting] = await SiteSettings.upsert({
        key,
        value,
    })

    res.json({
        success: true,
        message: 'Setting updated successfully',
        key: setting.key,
        value: setting.value,
    })
})
