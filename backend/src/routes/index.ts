import { Router } from 'express'
import authRoutes from './auth.routes.js'
import usersRoutes from './users.routes.js'
import groupsRoutes from './groups.routes.js'
import postsRoutes from './posts.routes.js'
import eventsRoutes from './events.routes.js'
import albumsRoutes from './albums.routes.js'
import notificationsRoutes from './notifications.routes.js'
import settingsRoutes from './settings.routes.js'
import interactionsRoutes from './interactions.routes.js'
import feedRoutes from './feed.routes.js'

const router = Router()

// Mount all routes
router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/groups', groupsRoutes)
router.use('/posts', postsRoutes)
router.use('/events', eventsRoutes)
router.use('/albums', albumsRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/settings', settingsRoutes)
router.use('/feed', feedRoutes)
router.use('/', interactionsRoutes)  // Interactions at root for /api/:type/:id/like pattern

// Health check
router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    })
})

export default router
