import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface GroupAttributes {
    id: string
    name: string
    description: string | null
    groupTypeId: string | null
    createdBy: string
    createdAt?: Date
    updatedAt?: Date
}

interface GroupCreationAttributes extends Optional<GroupAttributes, 'id' | 'description' | 'groupTypeId'> { }

class Group extends Model<GroupAttributes, GroupCreationAttributes> implements GroupAttributes {
    declare id: string
    declare name: string
    declare description: string | null
    declare groupTypeId: string | null
    declare createdBy: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

Group.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        groupTypeId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'group_types',
                key: 'id',
            },
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
        tableName: 'groups',
        modelName: 'Group',
    }
)

export { Group, GroupAttributes, GroupCreationAttributes }
