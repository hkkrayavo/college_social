import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/index.js'
import {
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupMembers,
    removeGroupMember,
    getGroupMembers,
    getGroupTypes,
    createGroupType,
    updateGroupType,
    deleteGroupType,
} from '../controllers/groups.controller.js'


const router = Router()

// ==========================================
// Groups Routes (RESTful)
// ==========================================

// GET /api/groups - List groups
// User: their groups only | Admin with ?all=true: all groups
router.get('/', authenticate, getGroups)

// GET /api/groups/types - Get group types
router.get('/types', authenticate, getGroupTypes)

// POST /api/groups/types - Create group type (Admin only)
router.post('/types', authenticate, requireAdmin, createGroupType)

// PATCH /api/groups/types/:id - Update group type (Admin only)
router.patch('/types/:id', authenticate, requireAdmin, updateGroupType)

// DELETE /api/groups/types/:id - Delete group type (Admin only)
router.delete('/types/:id', authenticate, requireAdmin, deleteGroupType)

// POST /api/groups - Create group (Admin only)
router.post('/', authenticate, requireAdmin, createGroup)

// PATCH /api/groups/:id - Update group (Admin only)
router.patch('/:id', authenticate, requireAdmin, updateGroup)

// DELETE /api/groups/:id - Delete group (Admin only)
router.delete('/:id', authenticate, requireAdmin, deleteGroup)

// ==========================================
// Group Members Routes
// ==========================================

// GET /api/groups/:id/members - List group members (Admin only)
router.get('/:id/members', authenticate, requireAdmin, getGroupMembers)

// POST /api/groups/:id/members - Add members to group (Admin only)
router.post('/:id/members', authenticate, requireAdmin, addGroupMembers)

// DELETE /api/groups/:id/members/:userId - Remove member from group (Admin only)
router.delete('/:id/members/:userId', authenticate, requireAdmin, removeGroupMember)

export default router
