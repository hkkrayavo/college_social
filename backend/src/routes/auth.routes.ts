import { Router } from 'express'
import { otpLimiter, authLimiter } from '../middleware/index.js'
import { requestOtp, verifyOtp, refreshToken, logout } from '../controllers/auth.controller.js'

const router = Router()

// POST /api/auth/request-otp - Request OTP for login
router.post('/request-otp', otpLimiter, requestOtp)

// POST /api/auth/verify-otp - Verify OTP and get JWT
router.post('/verify-otp', authLimiter, verifyOtp)

// POST /api/auth/refresh-token - Refresh access token
router.post('/refresh-token', refreshToken)

// POST /api/auth/logout - Invalidate session
router.post('/logout', logout)

export default router
