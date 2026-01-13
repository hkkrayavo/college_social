import type { Request } from 'express'

interface PaginationParams {
    page: number
    limit: number
    offset: number
}

interface PaginationResult<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

// Extract pagination params from request
export function getPaginationParams(req: Request, defaultLimit = 20): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || defaultLimit))
    const offset = (page - 1) * limit

    return { page, limit, offset }
}

// Create paginated response
export function paginatedResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginationResult<T> {
    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages: Math.ceil(total / params.limit),
        },
    }
}
