// Common TypeScript types for the backend

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

// JWT payload type
export interface JwtPayload {
    userId: string
    roles: string[]
    iat?: number
    exp?: number
}

// Request with authenticated user
export interface AuthenticatedRequest {
    user: {
        id: string
        roles: string[]
    }
}
