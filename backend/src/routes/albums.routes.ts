import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/index.js'
import { albumMediaUpload } from '../config/multer.js'
import {
    getAlbumById,
    updateAlbum,
    deleteAlbum,
    addAlbumMedia,
    removeAlbumMedia,
} from '../controllers/albums.controller.js'

const router = Router()

// ==========================================
// Albums Routes (RESTful)
// ==========================================

// GET /api/albums/:id - Get album details with media
router.get('/:id', authenticate, getAlbumById)

// PATCH /api/albums/:id - Update album (Admin only)
router.patch('/:id', authenticate, requireAdmin, updateAlbum)

// DELETE /api/albums/:id - Delete album (Admin only)
router.delete('/:id', authenticate, requireAdmin, deleteAlbum)

// ==========================================
// Album Media Routes
// ==========================================

// POST /api/albums/:id/media - Add media to album (Admin only)
router.post('/:id/media', authenticate, requireAdmin, albumMediaUpload.single('media'), addAlbumMedia)

// DELETE /api/albums/:id/media/:mediaId - Remove media (Admin only)
router.delete('/:id/media/:mediaId', authenticate, requireAdmin, removeAlbumMedia)

export default router
