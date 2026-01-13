import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

export type LikeableType = 'post' | 'comment' | 'event' | 'album' | 'album_media'

interface LikeAttributes {
    id: string
    userId: string
    likeableType: LikeableType
    likeableId: string
    createdAt?: Date
}

interface LikeCreationAttributes extends Optional<LikeAttributes, 'id'> { }

class Like extends Model<LikeAttributes, LikeCreationAttributes> implements LikeAttributes {
    declare id: string
    declare userId: string
    declare likeableType: LikeableType
    declare likeableId: string
    declare readonly createdAt: Date
}

Like.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        likeableType: {
            type: DataTypes.ENUM('post', 'comment', 'event', 'album', 'album_media'),
            allowNull: false,
        },
        likeableId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'likes',
        modelName: 'Like',
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'likeable_type', 'likeable_id'],
            },
        ],
    }
)

export { Like, LikeAttributes, LikeCreationAttributes }
