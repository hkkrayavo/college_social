import { Router } from 'express'
import { authenticate, requireRole } from '../middleware/auth.js'
import {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
} from '../controllers/events.controller.js'
import {
    getAlbumsByEvent,
    createAlbum,
} from '../controllers/albums.controller.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/events - Get events (all users, filtered by access)
router.get('/', getEvents)

// GET /api/events/:id - Get event details with albums
router.get('/:id', getEventById)

// POST /api/events - Create event (admin only)
router.post('/', requireRole('admin', 'super_admin'), createEvent)

// PATCH /api/events/:id - Update event (admin only)
router.patch('/:id', requireRole('admin', 'super_admin'), updateEvent)

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', requireRole('admin', 'super_admin'), deleteEvent)

// ==========================================
// Albums under Events
// ==========================================

// GET /api/events/:eventId/albums - Get albums for an event
router.get('/:eventId/albums', getAlbumsByEvent)

// POST /api/events/:eventId/albums - Create album within event (admin only)
router.post('/:eventId/albums', requireRole('admin', 'super_admin'), createAlbum)

export default router

