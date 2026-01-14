import { Sequelize } from 'sequelize'
import { env } from './env.js'

export const sequelize = new Sequelize(
    env.DB_NAME,
    env.DB_USER,
    env.DB_PASSWORD,
    {
        host: env.DB_HOST,
        port: env.DB_PORT,
        dialect: 'mysql',
        logging: env.isDev ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true, // Use snake_case for columns
        },
    }
)

// Test database connection
export async function connectDatabase(): Promise<void> {
    try {
        await sequelize.authenticate()
        console.log('✅ Database connection established successfully')

        // Sync models in development (auto-create tables)
        // Note: alter:true disabled - database has too many indexes from repeated syncs
        // Use migrations for schema changes instead
        // Sync models (auto-create tables if they don't exist)
        // In a real production app, use migrations. For now, we sync to ensure tables exist.
        await sequelize.sync({ alter: false })
        console.log('✅ Database synchronized')
    } catch (error) {
        console.error('❌ Unable to connect to database:', error)
        process.exit(1)
    }
}
