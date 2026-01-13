/**
 * File Validation Utility
 * Validates file types and sizes for uploads
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

// Size limits in bytes
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_PROFILE_PICTURE_SIZE = 2 * 1024 * 1024 // 2MB

export type FileType = 'image' | 'video' | 'any'

export interface ValidationResult {
    valid: boolean
    error?: string
}

/**
 * Validate a file based on type and size
 */
export function validateFile(
    file: { mimetype: string; size: number },
    allowedType: FileType = 'any'
): ValidationResult {
    // Check file type
    let allowedTypes: string[]
    let maxSize: number

    if (allowedType === 'image') {
        allowedTypes = ALLOWED_IMAGE_TYPES
        maxSize = MAX_IMAGE_SIZE
    } else if (allowedType === 'video') {
        allowedTypes = ALLOWED_VIDEO_TYPES
        maxSize = MAX_VIDEO_SIZE
    } else {
        allowedTypes = ALLOWED_MEDIA_TYPES
        maxSize = file.mimetype.startsWith('video/') ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    }

    if (!allowedTypes.includes(file.mimetype)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        }
    }

    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024)
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSizeMB}MB`,
        }
    }

    return { valid: true }
}

/**
 * Validate profile picture specifically
 */
export function validateProfilePicture(file: { mimetype: string; size: number }): ValidationResult {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return {
            valid: false,
            error: 'Profile picture must be an image (JPEG, PNG, GIF, or WebP)',
        }
    }

    if (file.size > MAX_PROFILE_PICTURE_SIZE) {
        return {
            valid: false,
            error: 'Profile picture must be less than 2MB',
        }
    }

    return { valid: true }
}

/**
 * Get media type from MIME type
 */
export function getMediaType(mimetype: string): 'image' | 'video' {
    return mimetype.startsWith('video/') ? 'video' : 'image'
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalName: string): string {
    const ext = originalName.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}.${ext}`
}
