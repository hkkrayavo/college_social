import type { Request, Response } from 'express'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { smsService } from '../services/sms.service.js'

// GET /api/sms-templates - Get all templates
export const getAllTemplates = asyncHandler(async (_req: Request, res: Response) => {
    const templates = await smsService.getAllTemplates()

    res.json({
        success: true,
        data: templates.map(t => ({
            id: t.id,
            key: t.key,
            name: t.name,
            description: t.description,
            content: t.content,
            variables: t.variables,
            isActive: t.isActive,
        })),
    })
})

// GET /api/sms-templates/:key - Get single template
export const getTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params
    const template = await smsService.getTemplate(key)

    if (!template) {
        throw createError('Template not found', 404)
    }

    res.json({
        success: true,
        data: {
            id: template.id,
            key: template.key,
            name: template.name,
            description: template.description,
            content: template.content,
            variables: template.variables,
            isActive: template.isActive,
        },
    })
})

// PATCH /api/sms-templates/:key - Update template content
export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params
    const { content } = req.body

    if (!content || typeof content !== 'string') {
        throw createError('Content is required', 400)
    }

    const template = await smsService.updateTemplate(key, content)

    if (!template) {
        throw createError('Template not found', 404)
    }

    res.json({
        success: true,
        message: 'Template updated successfully',
        data: {
            key: template.key,
            content: template.content,
        },
    })
})

// POST /api/sms-templates/:key/toggle - Toggle active status
export const toggleTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params

    const template = await smsService.toggleTemplate(key)

    if (!template) {
        throw createError('Template not found', 404)
    }

    res.json({
        success: true,
        message: `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
            key: template.key,
            isActive: template.isActive,
        },
    })
})
