import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface AlbumAttributes {
    id: string
    name: string
    eventId: string
    description: string | null
    createdBy: string
    createdAt?: Date
    updatedAt?: Date
}

interface AlbumCreationAttributes extends Optional<AlbumAttributes, 'id' | 'description'> { }

class Album extends Model<AlbumAttributes, AlbumCreationAttributes> implements AlbumAttributes {
    declare id: string
    declare name: string
    declare eventId: string
    declare description: string | null
    declare createdBy: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

Album.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'events',
                key: 'id',
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'albums',
        modelName: 'Album',
    }
)

export { Album, AlbumAttributes, AlbumCreationAttributes }
