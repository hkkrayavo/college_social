/**
 * Multer Configuration
 * File upload middleware configuration
 */

import multer from 'multer'
import { ALLOWED_IMAGE_TYPES, ALLOWED_MEDIA_TYPES, MAX_VIDEO_SIZE } from '../utils/fileValidation.js'

// Memory storage - files stored in buffer for S3 upload
const storage = multer.memoryStorage()

// File filter for images only
const imageFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'))
    }
}

// File filter for all media (images and videos)
const mediaFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (ALLOWED_MEDIA_TYPES.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Only image and video files are allowed'))
    }
}

/**
 * Upload configuration for profile pictures
 * - Single image file
 * - Max 2MB
 */
export const profilePictureUpload = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
})

/**
 * Upload configuration for post media
 * - Multiple files (up to 10)
 * - Images max 5MB, videos max 50MB
 */
export const postMediaUpload = multer({
    storage,
    fileFilter: mediaFilter,
    limits: {
        fileSize: MAX_VIDEO_SIZE, // 50MB (max for videos)
        files: 10,
    },
})

/**
 * Upload configuration for album media
 * - Multiple files (up to 50)
 * - Images max 5MB, videos max 50MB
 */
export const albumMediaUpload = multer({
    storage,
    fileFilter: mediaFilter,
    limits: {
        fileSize: MAX_VIDEO_SIZE,
        files: 50,
    },
})

export default {
    profilePictureUpload,
    postMediaUpload,
    albumMediaUpload,
}
