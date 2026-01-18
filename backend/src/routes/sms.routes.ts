import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/index.js'
import {
    getAllTemplates,
    getTemplate,
    updateTemplate,
    toggleTemplate,
} from '../controllers/sms.controller.js'

const router = Router()

// All routes require authentication and admin role
router.use(authenticate, requireAdmin)

// GET /api/sms-templates - Get all templates
router.get('/', getAllTemplates)

// GET /api/sms-templates/:key - Get single template
router.get('/:key', getTemplate)

// PATCH /api/sms-templates/:key - Update template content
router.patch('/:key', updateTemplate)

// POST /api/sms-templates/:key/toggle - Toggle active status
router.post('/:key/toggle', toggleTemplate)

export default router
