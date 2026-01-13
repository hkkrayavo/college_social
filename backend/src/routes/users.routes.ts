import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/index.js'
import { signup, getMe, updateMe, uploadProfilePicture } from '../controllers/users.controller.js'
import { profilePictureUpload } from '../config/multer.js'
import {
    getAllUsers,
    updateUserStatus,
    deleteUser,
    updateUser,
    createUserByAdmin,
    getDashboardStats,
    getSetting,
    updateSetting,
} from '../controllers/admin.controller.js'

const router = Router()

// ==========================================
// Public Routes
// ==========================================

// POST /api/users/signup - User self-registration
router.post('/signup', signup)

// ==========================================
// Authenticated Routes (Current User)
// ==========================================

// GET /api/users/me - Get current user profile
router.get('/me', authenticate, getMe)

// PATCH /api/users/me - Update own profile
router.patch('/me', authenticate, updateMe)

// POST /api/users/me/profile-picture - Upload profile picture
router.post(
    '/me/profile-picture',
    authenticate,
    profilePictureUpload.single('profilePicture'),
    uploadProfilePicture
)

// ==========================================
// Admin Routes (RESTful - no /admin/ prefix)
// ==========================================

// GET /api/users/stats - Dashboard stats (Admin only)
router.get('/stats', authenticate, requireAdmin, getDashboardStats)

// GET /api/users - List users (Admin: all users with filters)
// Query params: ?status=pending|approved|rejected&search=...
router.get('/', authenticate, requireAdmin, getAllUsers)

// POST /api/users - Create user (Admin only, auto-approved)
router.post('/', authenticate, requireAdmin, createUserByAdmin)

// GET /api/users/:id - Get specific user (Admin only)
// router.get('/:id', authenticate, requireAdmin, getUserById)

// PATCH /api/users/:id - Update user details (Admin only)
router.patch('/:id', authenticate, requireAdmin, updateUser)

// PATCH /api/users/:id/status - Update user status: approve/reject (Admin only)
// Body: { status: 'approved' | 'rejected', reason?: string }
router.patch('/:id/status', authenticate, requireAdmin, updateUserStatus)

// DELETE /api/users/:id - Soft delete user (Admin only)
router.delete('/:id', authenticate, requireAdmin, deleteUser)

// ==========================================
// Admin Settings Routes
// ==========================================

// GET /api/users/settings/:key - Get a site setting (Admin only)
router.get('/settings/:key', authenticate, requireAdmin, getSetting)

// PUT /api/users/settings/:key - Update a site setting (Admin only)
router.put('/settings/:key', authenticate, requireAdmin, updateSetting)

export default router

