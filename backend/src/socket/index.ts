/**
 * Socket.io Server
 * Real-time notifications and communication
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import { verifyToken } from '../utils/jwt.js'
import { env } from '../config/env.js'

let io: SocketIOServer | null = null

// Map of userId to socket IDs (a user can have multiple connections)
const userSockets = new Map<string, Set<string>>()

/**
 * Initialize Socket.io server
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: env.CLIENT_URL,
            credentials: true,
        },
    })

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')

        if (!token) {
            return next(new Error('Authentication required'))
        }

        try {
            const payload = verifyToken(token)
            socket.data.userId = payload.userId
            socket.data.roles = payload.roles
            next()
        } catch {
            next(new Error('Invalid token'))
        }
    })

    // Connection handler
    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId

        console.log(`[Socket] User connected: ${userId} (${socket.id})`)

        // Add socket to user's set
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set())
        }
        userSockets.get(userId)!.add(socket.id)

        // Join user-specific room for targeted notifications
        socket.join(`user:${userId}`)

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${userId} (${socket.id})`)

            const sockets = userSockets.get(userId)
            if (sockets) {
                sockets.delete(socket.id)
                if (sockets.size === 0) {
                    userSockets.delete(userId)
                }
            }
        })

        // Handle join group room (for group notifications)
        socket.on('join:group', (groupId: string) => {
            socket.join(`group:${groupId}`)
            console.log(`[Socket] User ${userId} joined group:${groupId}`)
        })

        // Handle leave group room
        socket.on('leave:group', (groupId: string) => {
            socket.leave(`group:${groupId}`)
            console.log(`[Socket] User ${userId} left group:${groupId}`)
        })
    })

    console.log('🔌 Socket.io initialized')
    return io
}

/**
 * Get the Socket.io instance
 */
export function getIO(): SocketIOServer {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocket first.')
    }
    return io
}

/**
 * Send notification to a specific user
 */
export function sendNotificationToUser(userId: string, notification: {
    type: string
    title: string
    message: string
    referenceType?: string
    referenceId?: string
}): void {
    if (!io) {
        console.warn('[Socket] Cannot send notification: Socket.io not initialized')
        return
    }

    io.to(`user:${userId}`).emit('notification', notification)
    console.log(`[Socket] Notification sent to user:${userId}`)
}

/**
 * Send notification to all members of a group
 */
export function sendNotificationToGroup(groupId: string, notification: {
    type: string
    title: string
    message: string
    referenceType?: string
    referenceId?: string
}): void {
    if (!io) {
        console.warn('[Socket] Cannot send notification: Socket.io not initialized')
        return
    }

    io.to(`group:${groupId}`).emit('notification', notification)
    console.log(`[Socket] Notification sent to group:${groupId}`)
}

/**
 * Send notification to all admins
 */
export function sendNotificationToAdmins(notification: {
    type: string
    title: string
    message: string
    referenceType?: string
    referenceId?: string
}): void {
    if (!io) {
        console.warn('[Socket] Cannot send notification: Socket.io not initialized')
        return
    }

    io.emit('admin:notification', notification)
    console.log(`[Socket] Admin notification broadcasted`)
}

/**
 * Check if a user is currently online
 */
export function isUserOnline(userId: string): boolean {
    return userSockets.has(userId) && userSockets.get(userId)!.size > 0
}

/**
 * Get count of online users
 */
export function getOnlineUsersCount(): number {
    return userSockets.size
}

export default {
    initializeSocket,
    getIO,
    sendNotificationToUser,
    sendNotificationToGroup,
    sendNotificationToAdmins,
    isUserOnline,
    getOnlineUsersCount,
}
