import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

export type NotificationType = 'post_approved' | 'post_rejected' | 'new_post' | 'comment' | 'like'
export type ReferenceType = 'post' | 'comment' | 'album'

interface NotificationAttributes {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    referenceType: ReferenceType | null
    referenceId: string | null
    isRead: boolean
    createdAt?: Date
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'referenceType' | 'referenceId' | 'isRead'> { }

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    declare id: string
    declare userId: string
    declare type: NotificationType
    declare title: string
    declare message: string
    declare referenceType: ReferenceType | null
    declare referenceId: string | null
    declare isRead: boolean
    declare readonly createdAt: Date
}

Notification.init(
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
        type: {
            type: DataTypes.ENUM('post_approved', 'post_rejected', 'new_post', 'comment', 'like'),
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        referenceType: {
            type: DataTypes.ENUM('post', 'comment', 'album'),
            allowNull: true,
        },
        referenceId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'notifications',
        modelName: 'Notification',
        updatedAt: false,
        indexes: [
            {
                fields: ['user_id', 'is_read', 'created_at'],
            },
        ],
    }
)

export { Notification, NotificationAttributes, NotificationCreationAttributes }
