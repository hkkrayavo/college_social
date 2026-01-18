import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface SmsTemplateAttributes {
    id: string
    key: string
    name: string
    description: string | null
    content: string
    variables: string[] // JSON array of available variable names
    isActive: boolean
    createdAt?: Date
    updatedAt?: Date
}

interface SmsTemplateCreationAttributes extends Optional<SmsTemplateAttributes, 'id' | 'description' | 'isActive'> { }

class SmsTemplate extends Model<SmsTemplateAttributes, SmsTemplateCreationAttributes> implements SmsTemplateAttributes {
    declare id: string
    declare key: string
    declare name: string
    declare description: string | null
    declare content: string
    declare variables: string[]
    declare isActive: boolean
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

SmsTemplate.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        key: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        variables: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'sms_templates',
        modelName: 'SmsTemplate',
    }
)

export { SmsTemplate, SmsTemplateAttributes, SmsTemplateCreationAttributes }
