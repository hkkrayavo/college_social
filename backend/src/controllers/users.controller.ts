import type { Request, Response } from 'express'
import { User, Role, UserRole } from '../models/index.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { storageService } from '../services/storageService.js'

// POST /api/users/signup
export const signup = asyncHandler(async (req: Request, res: Response) => {
    const { name, mobileNumber, email, role = 'user' } = req.body

    if (!name || !mobileNumber) {
        throw createError('Name and mobile number are required', 400)
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { mobileNumber } })
    if (existingUser) {
        throw createError('User with this mobile number already exists', 409)
    }

    // Create user with pending status
    const user = await User.create({
        name,
        mobileNumber,
        email,
        status: 'pending',
        createdByAdmin: false,
    })

    // Find the role
    const userRole = await Role.findOne({ where: { name: role } })
    if (userRole) {
        await UserRole.create({
            userId: user.id,
            roleId: userRole.id,
            assignedAt: new Date(),
        })
    }

    res.status(201).json({
        success: true,
        message: 'Account created successfully. Please wait for admin approval.',
        user: {
            id: user.id,
            name: user.name,
            mobileNumber: user.mobileNumber,
            email: user.email,
            status: user.status,
        },
    })
})

// GET /api/users/me
export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
        throw createError('User not found', 401)
    }

    const user = await User.findByPk(userId, {
        include: [{ model: Role, as: 'roles' }],
    })

    if (!user) {
        throw createError('User not found', 404)
    }

    const roles = (user as any).roles?.map((r: Role) => r.name) || ['user']

    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            mobileNumber: user.mobileNumber,
            email: user.email,
            profilePictureUrl: user.profilePictureUrl,
            status: user.status,
            firstLoginComplete: user.firstLoginComplete,
            role: roles[0] || 'user',
        },
    })
})

// PATCH /api/users/me
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id
    const { name, email } = req.body

    if (!userId) {
        throw createError('User not found', 401)
    }

    const user = await User.findByPk(userId)
    if (!user) {
        throw createError('User not found', 404)
    }

    await user.update({
        ...(name && { name }),
        ...(email && { email }),
    })

    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    })
})

// POST /api/users/me/profile-picture
export const uploadProfilePicture = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id

    if (!userId) {
        throw createError('User not found', 401)
    }

    const file = req.file
    if (!file) {
        throw createError('No file uploaded', 400)
    }

    // Validate file
    const { validateProfilePicture } = await import('../utils/fileValidation.js')
    const validation = validateProfilePicture(file)
    if (!validation.valid) {
        throw createError(validation.error || 'Invalid file', 400)
    }

    // Upload to Spaces
    const profilePictureUrl = await storageService.uploadFile(file, 'profiles', userId)

    // Update user
    const user = await User.findByPk(userId)
    if (!user) {
        throw createError('User not found', 404)
    }

    // Delete old profile picture if exists
    if (user.profilePictureUrl) {
        await storageService.deleteFile(user.profilePictureUrl)
    }

    await user.update({
        profilePictureUrl,
        firstLoginComplete: true,
    })

    res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        profilePictureUrl,
    })
})

