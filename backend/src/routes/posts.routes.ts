import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/index.js'
import {
    getPosts,
    getPostById,
    createPost,
    deletePost,
    updatePostStatus,
    uploadPostMedia,
    likePost,
    unlikePost,
    getPostComments,
    addComment,
    updateComment,
    deleteComment,
} from '../controllers/posts.controller.js'
import { postMediaUpload } from '../config/multer.js'

const router = Router()

// ==========================================
// Posts Routes (RESTful)
// ==========================================

// GET /api/posts - Get posts
// Query params: ?mine=true (user's posts) | ?status=pending (admin: pending posts)
// Default: user's feed
router.get('/', authenticate, getPosts)

// GET /api/posts/:id - Get single post by ID
router.get('/:id', authenticate, getPostById)

// POST /api/posts - Create a post
router.post('/', authenticate, createPost)

// POST /api/posts/upload-media - Upload media for Editor.js
router.post('/upload-media', authenticate, postMediaUpload.single('image'), uploadPostMedia)

// DELETE /api/posts/:id - Delete post
router.delete('/:id', authenticate, deletePost)

// PATCH /api/posts/:id/status - Update post status (Admin only)
// Body: { status: 'approved' | 'rejected', reason?: string, groupIds?: string[] }
router.patch('/:id/status', authenticate, requireAdmin, updatePostStatus)

// ==========================================
// Likes & Comments
// ==========================================

// POST /api/posts/:id/like - Like a post
router.post('/:id/like', authenticate, likePost)

// DELETE /api/posts/:id/like - Unlike a post
router.delete('/:id/like', authenticate, unlikePost)

// GET /api/posts/:id/comments - Get post comments
router.get('/:id/comments', authenticate, getPostComments)

// POST /api/posts/:id/comments - Add comment
router.post('/:id/comments', authenticate, addComment)

// PATCH /api/posts/:postId/comments/:commentId - Update comment
router.patch('/:postId/comments/:commentId', authenticate, updateComment)

// DELETE /api/posts/:postId/comments/:commentId - Delete comment
router.delete('/:postId/comments/:commentId', authenticate, deleteComment)

export default router
