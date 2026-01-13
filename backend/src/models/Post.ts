import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

export type PostStatus = 'pending' | 'approved' | 'rejected'

interface PostAttributes {
    id: string
    title: string | null
    content: string | null
    authorId: string
    status: PostStatus
    isPublic: boolean
    rejectionReason: string | null
    reviewedBy: string | null
    reviewedAt: Date | null
    createdAt?: Date
    updatedAt?: Date
}

interface PostCreationAttributes extends Optional<PostAttributes, 'id' | 'title' | 'content' | 'status' | 'isPublic' | 'rejectionReason' | 'reviewedBy' | 'reviewedAt'> { }

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
    declare id: string
    declare title: string | null
    declare content: string | null
    declare authorId: string
    declare status: PostStatus
    declare isPublic: boolean
    declare rejectionReason: string | null
    declare reviewedBy: string | null
    declare reviewedAt: Date | null
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

Post.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: true,
        },
        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending',
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        reviewedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'posts',
        modelName: 'Post',
    }
)

export { Post, PostAttributes, PostCreationAttributes }
