import { Router } from 'express'
import { SiteSettings } from '../models/index.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import type { Request, Response } from 'express'

const router = Router()

// GET /api/settings/:key - Public route to get a site setting
router.get('/:key', asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params

    const setting = await SiteSettings.findOne({ where: { key } })

    res.json({
        success: true,
        key,
        value: setting?.value || null,
    })
}))

export default router
