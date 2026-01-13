import { S3Client, PutObjectCommand, DeleteObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3'


// Initialize S3 Client for DigitalOcean Spaces
const s3Client = new S3Client({
    endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
    region: process.env.DO_SPACES_REGION || 'us-east-1', // DigitalOcean Spaces custom region or default
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || '',
        secretAccessKey: process.env.DO_SPACES_SECRET || '',
    },
})

export type FolderType = 'profiles' | 'posts' | 'albums'

export const storageService = {
    /**
     * Upload a file to DigitalOcean Spaces
     */
    async uploadFile(
        file: Express.Multer.File,
        folder: FolderType,
        subFolderId: string // userId or albumId
    ): Promise<string> {
        // Generate unique filename
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 10000)
        const ext = file.originalname.split('.').pop()
        const filename = `${timestamp}-${random}.${ext}`

        // Construct key (path): rootFolder/folder/subFolderId/filename
        const rootFolder = process.env.DO_SPACES_ROOT_FOLDER ? `${process.env.DO_SPACES_ROOT_FOLDER}/` : ''
        const key = `${rootFolder}${folder}/${subFolderId}/${filename}`
        const bucket = process.env.DO_SPACES_BUCKET || ''

        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: ObjectCannedACL.public_read, // Make file public
            }))

            // Return public URL
            // If CDN URL is provided, use it. Otherwise use generic Space URL.
            const cdnUrl = process.env.DO_SPACES_CDN_URL
            if (cdnUrl) {
                return `${cdnUrl}/${key}`
            }

            return `https://${bucket}.${process.env.DO_SPACES_ENDPOINT}/${key}`
        } catch (error) {
            console.error('S3 Upload Error:', error)
            throw new Error('Failed to upload file to storage')
        }
    },

    /**
     * Delete a file from DigitalOcean Spaces
     */
    async deleteFile(fileUrl: string): Promise<void> {
        if (!fileUrl) return

        try {
            // Extract key from URL
            // URL formats:
            // https://bucket.endpoint/key
            // https://cdn.com/key

            const bucket = process.env.DO_SPACES_BUCKET || ''
            const endpoint = process.env.DO_SPACES_ENDPOINT || ''
            const cdnUrl = process.env.DO_SPACES_CDN_URL

            let key = ''

            if (cdnUrl && fileUrl.startsWith(cdnUrl)) {
                key = fileUrl.replace(`${cdnUrl}/`, '')
            } else if (fileUrl.includes(endpoint)) {
                // Split by bucket/endpoint combo or just endpoint
                const urlParts = fileUrl.split(endpoint)
                if (urlParts.length > 1) {
                    // urlParts[1] is /key
                    key = urlParts[1].substring(1) // Remove leading slash
                }
            }

            if (!key) {
                console.warn('Could not extract S3 key from URL:', fileUrl)
                return
            }

            await s3Client.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            }))
        } catch (error) {
            console.error('S3 Delete Error:', error)
            // Don't throw error for delete failures, just log it
        }
    },
}
