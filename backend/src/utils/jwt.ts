import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

interface TokenPayload {
    userId: string
    roles: string[]
}

interface TokenPair {
    accessToken: string
    refreshToken: string
}

// Generate access token (short-lived)
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY as string,
    } as jwt.SignOptions)
}

// Generate refresh token (long-lived)
export function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY as string,
    } as jwt.SignOptions)
}

// Generate both tokens
export function generateTokens(payload: TokenPayload): TokenPair {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    }
}

// Verify and decode token
export function verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}

// Decode token without verification (useful for expired tokens)
export function decodeToken(token: string): TokenPayload | null {
    try {
        return jwt.decode(token) as TokenPayload | null
    } catch {
        return null
    }
}

// Get expiry time in seconds
export function getAccessExpirySeconds(): number {
    const expiry = env.JWT_ACCESS_EXPIRY
    if (expiry.endsWith('m')) return parseInt(expiry) * 60
    if (expiry.endsWith('h')) return parseInt(expiry) * 3600
    if (expiry.endsWith('d')) return parseInt(expiry) * 86400
    return parseInt(expiry)
}
