import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import { env, connectDatabase } from './config/index.js'
import { seedDatabase } from './config/seed.js'
import { apiLimiter, errorHandler, notFoundHandler } from './middleware/index.js'
import routes from './routes/index.js'
import { initializeSocket } from './socket/index.js'

// Import models to initialize associations
import './models/index.js'

const app = express()
const httpServer = createServer(app)

// ==========================================
// Security Middleware
// ==========================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}))

// ==========================================
// Body Parsing
// ==========================================
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ==========================================
// Rate Limiting
// ==========================================
app.use('/api', apiLimiter)

import path from 'path'

// ==========================================
// API Routes
// ==========================================
import fs from 'fs'

// ==========================================
// API Routes
// ==========================================
app.use('/uploads', (req, _res, next) => {
    const requestPath = req.url
    const fullPath = path.join(process.cwd(), 'uploads', requestPath)

    console.log('--- Static File Debug ---')
    console.log(`URL: ${req.url}`)
    console.log(`Looking at: ${fullPath}`)
    console.log(`Exists? ${fs.existsSync(fullPath)}`)

    next()
}, express.static(path.join(process.cwd(), 'uploads')))
app.use('/api', routes)

// ==========================================
// Error Handling
// ==========================================
app.use(notFoundHandler)
app.use(errorHandler)

// ==========================================
// Start Server
// ==========================================
async function startServer() {
    try {
        // Connect to database
        await connectDatabase()

        // Seed database with initial data
        await seedDatabase()

        // Initialize Socket.io
        initializeSocket(httpServer)

        // Start HTTP server
        httpServer.listen(env.PORT, () => {
            console.log(`🚀 Server running on http://localhost:${env.PORT}`)
            console.log(`📍 Environment: ${env.NODE_ENV}`)
            console.log(`📂 Working Directory: ${process.cwd()}`)
            console.log(`📂 Uploads Directory: ${path.join(process.cwd(), 'uploads')}`)
            console.log(`🎯 API Endpoint: http://localhost:${env.PORT}/api`)
        })
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

startServer()

export default app
