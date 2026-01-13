import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
    addLike,
    removeLike,
    getLikes,
    getComments,
    addComment,
    deleteComment,
} from '../controllers/interactions.controller.js'

const router = Router()

// ==========================================
// Like Routes - /api/:type/:id/like
// ==========================================
router.post('/:type/:id/like', authenticate, addLike)
router.delete('/:type/:id/like', authenticate, removeLike)
router.get('/:type/:id/likes', authenticate, getLikes)

// ==========================================
// Comment Routes - /api/:type/:id/comments
// ==========================================
router.get('/:type/:id/comments', authenticate, getComments)
router.post('/:type/:id/comments', authenticate, addComment)
router.delete('/comments/:id', authenticate, deleteComment)

export default router
