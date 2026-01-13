import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface UserRoleAttributes {
    id: string
    userId: string
    roleId: string
    assignedBy: string | null
    assignedAt: Date
}

interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'assignedBy' | 'assignedAt'> { }

class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
    declare id: string
    declare userId: string
    declare roleId: string
    declare assignedBy: string | null
    declare assignedAt: Date
}

UserRole.init(
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
        roleId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'id',
            },
        },
        assignedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        assignedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'user_roles',
        modelName: 'UserRole',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'role_id'],
            },
        ],
    }
)

export { UserRole, UserRoleAttributes }
