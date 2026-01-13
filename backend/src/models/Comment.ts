import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

export type CommentableType = 'post' | 'event' | 'album' | 'album_media'

interface CommentAttributes {
    id: string
    userId: string
    commentableType: CommentableType
    commentableId: string
    content: string
    createdAt?: Date
    updatedAt?: Date
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id'> { }

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
    declare id: string
    declare userId: string
    declare commentableType: CommentableType
    declare commentableId: string
    declare content: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

Comment.init(
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
        commentableType: {
            type: DataTypes.ENUM('post', 'event', 'album', 'album_media'),
            allowNull: false,
        },
        commentableId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'comments',
        modelName: 'Comment',
        indexes: [
            {
                fields: ['commentable_type', 'commentable_id'],
            },
        ],
    }
)

export { Comment, CommentAttributes, CommentCreationAttributes }
