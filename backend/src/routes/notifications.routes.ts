import { Router } from 'express'
import { authenticate } from '../middleware/index.js'

const router = Router()

// GET /api/notifications - Get user notifications (paginated)
router.get('/', authenticate, (_req, res) => {
    res.json({ message: 'Get notifications - to be implemented' })
})

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', authenticate, (_req, res) => {
    res.json({ message: 'Get unread count - to be implemented' })
})

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticate, (_req, res) => {
    res.json({ message: 'Mark as read - to be implemented' })
})

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', authenticate, (_req, res) => {
    res.json({ message: 'Mark all as read - to be implemented' })
})

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticate, (_req, res) => {
    res.json({ message: 'Delete notification - to be implemented' })
})

export default router
