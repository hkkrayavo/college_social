import type { Request, Response } from 'express'
import { Op } from 'sequelize'
import { User, Role, OtpVerification } from '../models/index.js'
import { generateOtp, getOtpExpiry, MAX_OTP_ATTEMPTS } from '../utils/otp.js'
import { generateTokens, verifyToken, getAccessExpirySeconds } from '../utils/jwt.js'
import { asyncHandler, createError } from '../middleware/errorHandler.js'

// POST /api/auth/check-status
// Check if account exists and its approval status BEFORE sending OTP
export const checkAccountStatus = asyncHandler(async (req: Request, res: Response) => {
    const { mobileNumber } = req.body

    if (!mobileNumber || mobileNumber.length < 10) {
        throw createError('Valid mobile number is required', 400)
    }

    // Find user
    const user = await User.findOne({
        where: { mobileNumber },
    })

    if (!user) {
        // User doesn't exist - they can proceed to signup or this is a new login attempt
        res.json({
            success: true,
            exists: false,
            status: null,
            message: 'Account not found. Please sign up first.',
        })
        return
    }

    // Return account status
    res.json({
        success: true,
        exists: true,
        status: user.status,
        message: user.status === 'approved'
            ? 'Account is approved'
            : user.status === 'pending'
                ? 'Your account is pending approval'
                : 'Your account has been rejected',
    })
})

// POST /api/auth/request-otp
export const requestOtp = asyncHandler(async (req: Request, res: Response) => {
    const { mobileNumber } = req.body

    if (!mobileNumber || mobileNumber.length < 10) {
        throw createError('Valid mobile number is required', 400)
    }

    // Check if user exists and is approved before sending OTP
    const user = await User.findOne({ where: { mobileNumber } })

    if (user) {
        if (user.status === 'pending') {
            throw createError('Your account is pending approval', 403)
        }
        if (user.status === 'rejected') {
            throw createError('Your account has been rejected', 403)
        }
    }

    // Generate OTP
    const otp = generateOtp()
    const expiresAt = getOtpExpiry()

    // Delete any existing OTPs for this number
    await OtpVerification.destroy({
        where: { mobileNumber },
    })

    // Store new OTP
    await OtpVerification.create({
        mobileNumber,
        otp,
        expiresAt,
    })

    // In production, send OTP via SMS
    // For development, we'll log it
    console.log(`📱 OTP for ${mobileNumber}: ${otp}`)

    res.json({
        success: true,
        message: 'OTP sent successfully',
        // Only include OTP in development for testing
        ...(process.env.NODE_ENV === 'development' && { otp }),
    })
})

// POST /api/auth/verify-otp
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { mobileNumber, otp } = req.body

    if (!mobileNumber || !otp) {
        throw createError('Mobile number and OTP are required', 400)
    }

    // Find OTP record
    const otpRecord = await OtpVerification.findOne({
        where: {
            mobileNumber,
            expiresAt: { [Op.gt]: new Date() },
        },
        order: [['createdAt', 'DESC']],
    })

    if (!otpRecord) {
        throw createError('OTP expired or not found. Please request a new one.', 400)
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        await otpRecord.destroy()
        throw createError('Too many failed attempts. Please request a new OTP.', 400)
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
        await otpRecord.update({ attempts: otpRecord.attempts + 1 })
        throw createError('Invalid OTP', 400)
    }

    // OTP is valid - delete it
    await otpRecord.destroy()

    // Find or check user
    let user = await User.findOne({
        where: { mobileNumber },
        include: [{ model: Role, as: 'roles' }],
    })

    if (!user) {
        // User doesn't exist - they need to sign up first
        throw createError('User not found. Please sign up first.', 404)
    }

    // Check if user is approved
    if (user.status === 'pending') {
        throw createError('Your account is pending approval', 403)
    }

    if (user.status === 'rejected') {
        throw createError('Your account has been rejected', 403)
    }

    // Generate tokens
    const roles = (user as any).roles?.map((r: Role) => r.name) || ['user']
    const tokens = generateTokens({
        userId: user.id,
        roles,
    })

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
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: getAccessExpirySeconds(),
    })
})

// POST /api/auth/refresh-token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
        throw createError('Refresh token is required', 400)
    }

    try {
        // Verify refresh token
        const payload = verifyToken(refreshToken)

        // Get user with roles
        const user = await User.findByPk(payload.userId, {
            include: [{ model: Role, as: 'roles' }],
        })

        if (!user || user.status !== 'approved') {
            throw createError('User not found or not approved', 401)
        }

        // Generate new tokens
        const roles = (user as any).roles?.map((r: Role) => r.name) || ['user']
        const tokens = generateTokens({
            userId: user.id,
            roles,
        })

        res.json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: getAccessExpirySeconds(),
        })
    } catch {
        throw createError('Invalid or expired refresh token', 401)
    }
})

// POST /api/auth/logout
export const logout = asyncHandler(async (_req: Request, res: Response) => {
    // In a more advanced setup, you'd invalidate the refresh token here
    // For now, we just return success (client should clear tokens)
    res.json({
        success: true,
        message: 'Logged out successfully',
    })
})
