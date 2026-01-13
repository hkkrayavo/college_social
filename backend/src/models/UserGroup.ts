import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface UserGroupAttributes {
    id: string
    userId: string
    groupId: string
    joinedAt: Date
}

interface UserGroupCreationAttributes extends Optional<UserGroupAttributes, 'id' | 'joinedAt'> { }

class UserGroup extends Model<UserGroupAttributes, UserGroupCreationAttributes> implements UserGroupAttributes {
    declare id: string
    declare userId: string
    declare groupId: string
    declare joinedAt: Date
}

UserGroup.init(
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
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'groups',
                key: 'id',
            },
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'user_groups',
        modelName: 'UserGroup',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'group_id'],
            },
        ],
    }
)

export { UserGroup, UserGroupAttributes }
