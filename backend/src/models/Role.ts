import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface RoleAttributes {
    id: string
    name: string
    description: string | null
    isDefault: boolean
    canPostWithoutApproval: boolean
    canModeratePosts: boolean
    canManageUsers: boolean
    canManageGroups: boolean
    createdAt?: Date
    updatedAt?: Date
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'isDefault' | 'canPostWithoutApproval' | 'canModeratePosts' | 'canManageUsers' | 'canManageGroups'> { }

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    declare id: string
    declare name: string
    declare description: string | null
    declare isDefault: boolean
    declare canPostWithoutApproval: boolean
    declare canModeratePosts: boolean
    declare canManageUsers: boolean
    declare canManageGroups: boolean
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

Role.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        canPostWithoutApproval: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        canModeratePosts: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        canManageUsers: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        canManageGroups: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'roles',
        modelName: 'Role',
    }
)

export { Role, RoleAttributes, RoleCreationAttributes }
