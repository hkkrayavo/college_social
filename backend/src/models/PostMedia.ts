import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

export type MediaType = 'image' | 'video'

interface PostMediaAttributes {
    id: string
    postId: string
    mediaUrl: string
    mediaType: MediaType
    displayOrder: number
    createdAt?: Date
}

interface PostMediaCreationAttributes extends Optional<PostMediaAttributes, 'id' | 'displayOrder'> { }

class PostMedia extends Model<PostMediaAttributes, PostMediaCreationAttributes> implements PostMediaAttributes {
    declare id: string
    declare postId: string
    declare mediaUrl: string
    declare mediaType: MediaType
    declare displayOrder: number
    declare readonly createdAt: Date
}

PostMedia.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        postId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'posts',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        mediaUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        mediaType: {
            type: DataTypes.ENUM('image', 'video'),
            allowNull: false,
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: 'post_media',
        modelName: 'PostMedia',
        updatedAt: false,
    }
)

export { PostMedia, PostMediaAttributes }
