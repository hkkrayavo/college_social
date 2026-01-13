import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'
import type { MediaType } from './PostMedia.js'

interface AlbumMediaAttributes {
    id: string
    albumId: string
    mediaUrl: string
    mediaType: MediaType
    caption: string | null
    displayOrder: number
    createdAt?: Date
}

interface AlbumMediaCreationAttributes extends Optional<AlbumMediaAttributes, 'id' | 'caption' | 'displayOrder'> { }

class AlbumMedia extends Model<AlbumMediaAttributes, AlbumMediaCreationAttributes> implements AlbumMediaAttributes {
    declare id: string
    declare albumId: string
    declare mediaUrl: string
    declare mediaType: MediaType
    declare caption: string | null
    declare displayOrder: number
    declare readonly createdAt: Date
}

AlbumMedia.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        albumId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'albums',
                key: 'id',
            },
        },
        mediaUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        mediaType: {
            type: DataTypes.ENUM('image', 'video'),
            allowNull: false,
        },
        caption: {
            type: DataTypes.STRING(300),
            allowNull: true,
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'album_media',
        modelName: 'AlbumMedia',
        updatedAt: false,
    }
)

export { AlbumMedia, AlbumMediaAttributes }
