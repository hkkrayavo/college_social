import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.js'
import { User, Role } from '../models/index.js'

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
                roles: string[]
            }
        }
    }
}

// Verify JWT token middleware
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' })
            return
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)

        // Set user info on request
        req.user = {
            id: payload.userId,
            roles: payload.roles,
        }

        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}

// Check if user has required role(s)
export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' })
            return
        }

        const hasRole = req.user.roles.some((role) => allowedRoles.includes(role))

        if (!hasRole) {
            res.status(403).json({ error: 'Insufficient permissions' })
            return
        }

        next()
    }
}

// Admin role shorthand
export const requireAdmin = requireRole('admin')

// Alias for backward compatibility (same as requireAdmin)
export const requireModerator = requireRole('admin')

// Get full user with roles (utility for controllers)
export async function getFullUser(userId: string) {
    return User.findByPk(userId, {
        include: [{ model: Role, as: 'roles' }],
    })
}
