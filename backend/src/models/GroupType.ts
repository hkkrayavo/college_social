import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface GroupTypeAttributes {
    id: string
    label: string
    description: string | null
    createdAt?: Date
    updatedAt?: Date
}

interface GroupTypeCreationAttributes extends Optional<GroupTypeAttributes, 'id' | 'description'> { }

class GroupType extends Model<GroupTypeAttributes, GroupTypeCreationAttributes> implements GroupTypeAttributes {
    declare id: string
    declare label: string
    declare description: string | null
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

GroupType.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        label: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'group_types',
        modelName: 'GroupType',
    }
)

export { GroupType, GroupTypeAttributes, GroupTypeCreationAttributes }
