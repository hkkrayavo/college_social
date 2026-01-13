import rateLimit from 'express-rate-limit'

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window (increased for development)
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
})

// Stricter rate limiter for OTP requests (per PRD: 3 per 15 min)
export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 3 OTP requests per window
    message: { error: 'Too many OTP requests, please try again in 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.body?.mobileNumber || req.ip || 'unknown',
})

// Auth endpoints limiter
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many authentication attempts' },
    standardHeaders: true,
    legacyHeaders: false,
})
