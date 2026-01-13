import crypto from 'crypto'

// Generate a 4-digit OTP
export function generateOtp(): string {
    return crypto.randomInt(1000, 9999).toString()
}

// Calculate OTP expiry time (5 minutes from now)
export function getOtpExpiry(): Date {
    const expiry = new Date()
    expiry.setMinutes(expiry.getMinutes() + 5)
    return expiry
}

// Check if OTP is expired
export function isOtpExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt
}

// Maximum OTP attempts allowed
export const MAX_OTP_ATTEMPTS = 3

// Rate limiting: max OTP requests per 15 minutes
export const MAX_OTP_REQUESTS = 3
export const OTP_RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes in ms
