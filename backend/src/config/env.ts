import dotenv from 'dotenv'
dotenv.config()

export const env = {
    // App
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'college_social',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

    // SMS
    SMS_PROVIDER: process.env.SMS_PROVIDER || 'twilio',
    SMS_API_KEY: process.env.SMS_API_KEY || '',
    SMS_SENDER_ID: process.env.SMS_SENDER_ID || '',

    // DigitalOcean Spaces
    DO_SPACES_KEY: process.env.DO_SPACES_KEY || '',
    DO_SPACES_SECRET: process.env.DO_SPACES_SECRET || '',
    DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET || '',
    DO_SPACES_REGION: process.env.DO_SPACES_REGION || 'blr1',
    DO_SPACES_ENDPOINT: process.env.DO_SPACES_ENDPOINT || '',

    // Helpers
    isDev: process.env.NODE_ENV !== 'production',
    isProd: process.env.NODE_ENV === 'production',
}
