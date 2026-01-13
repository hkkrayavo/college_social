import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

interface AppError extends Error {
    statusCode?: number
    code?: string
}

// Global error handler middleware
export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Error:', err)

    const statusCode = err.statusCode || 500
    const message = env.isProd && statusCode === 500
        ? 'Internal server error'
        : err.message || 'Something went wrong'

    res.status(statusCode).json({
        error: message,
        ...(env.isDev && { stack: err.stack }),
    })
}

// Not found handler
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        error: `Route ${req.method} ${req.path} not found`,
    })
}

// Async wrapper to catch errors
export function asyncHandler<T>(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

// Create custom error with status code
export function createError(message: string, statusCode: number): AppError {
    const error: AppError = new Error(message)
    error.statusCode = statusCode
    return error
}
