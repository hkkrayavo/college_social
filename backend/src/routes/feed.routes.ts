import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getFeed, getAlbumDetail, getEventDetail } from '../controllers/feed.controller.js'

const router = Router()

// GET /api/feed - Get unified feed (events, albums)
router.get('/', authenticate, getFeed)

// GET /api/feed/event/:eventId - Get single event detail
router.get('/event/:eventId', authenticate, getEventDetail)

// GET /api/feed/album/:albumId - Get album detail with media
router.get('/album/:albumId', authenticate, getAlbumDetail)

export default router

