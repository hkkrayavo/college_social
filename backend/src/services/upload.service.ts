/**
 * Upload Service - DigitalOcean Spaces
 * Handles file uploads to DigitalOcean Spaces (S3-compatible)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'
import { generateUniqueFilename } from '../utils/fileValidation.js'

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
    endpoint: env.DO_SPACES_ENDPOINT,
    region: env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: env.DO_SPACES_KEY,
        secretAccessKey: env.DO_SPACES_SECRET,
    },
})

/**
 * Get CDN URL for uploaded file
 */
function getCdnUrl(key: string): string {
    // DigitalOcean Spaces CDN URL format
    // e.g., https://bucket-name.region.cdn.digitaloceanspaces.com/key
    const bucket = env.DO_SPACES_BUCKET
    const region = env.DO_SPACES_REGION
    return `https://${bucket}.${region}.cdn.digitaloceanspaces.com/${key}`
}

/**
 * Upload a file to DigitalOcean Spaces
 * @param file - The file buffer and metadata
 * @param folder - The folder path (e.g., 'profiles', 'posts')
 * @returns The CDN URL of the uploaded file
 */
export async function uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    folder: string
): Promise<string> {
    // Check if DO Spaces is configured
    if (!env.DO_SPACES_KEY || !env.DO_SPACES_BUCKET) {
        // In development, return a placeholder URL
        if (env.isDev) {
            console.log('[DEV] Mock upload:', folder, file.originalname)
            return `https://placeholder.local/${folder}/${generateUniqueFilename(file.originalname)}`
        }
        throw new Error('DigitalOcean Spaces is not configured')
    }

    const filename = generateUniqueFilename(file.originalname)
    const key = `${folder}/${filename}`

    const command = new PutObjectCommand({
        Bucket: env.DO_SPACES_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    })

    await s3Client.send(command)

    return getCdnUrl(key)
}

/**
 * Delete a file from DigitalOcean Spaces
 * @param fileUrl - The CDN URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    if (!env.DO_SPACES_KEY || !env.DO_SPACES_BUCKET) {
        if (env.isDev) {
            console.log('[DEV] Mock delete:', fileUrl)
            return
        }
        throw new Error('DigitalOcean Spaces is not configured')
    }

    // Extract key from CDN URL
    const urlParts = fileUrl.split('.cdn.digitaloceanspaces.com/')
    if (urlParts.length !== 2) {
        throw new Error('Invalid file URL format')
    }
    const key = urlParts[1]

    const command = new DeleteObjectCommand({
        Bucket: env.DO_SPACES_BUCKET,
        Key: key,
    })

    await s3Client.send(command)
}

/**
 * Upload profile picture
 * @param userId - User ID for folder organization
 * @param file - The image file
 */
export async function uploadProfilePicture(
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string }
): Promise<string> {
    return uploadFile(file, `profiles/${userId}`)
}

/**
 * Upload post media
 * @param postId - Post ID for folder organization
 * @param file - The media file
 */
export async function uploadPostMedia(
    postId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string }
): Promise<string> {
    return uploadFile(file, `posts/${postId}`)
}

/**
 * Upload album media
 * @param albumId - Album ID for folder organization
 * @param file - The media file
 */
export async function uploadAlbumMedia(
    albumId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string }
): Promise<string> {
    return uploadFile(file, `albums/${albumId}`)
}

export default {
    uploadFile,
    deleteFile,
    uploadProfilePicture,
    uploadPostMedia,
    uploadAlbumMedia,
}
