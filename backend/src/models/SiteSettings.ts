import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface SiteSettingsAttributes {
    id: string
    key: string
    value: string | null
    createdAt?: Date
    updatedAt?: Date
}

interface SiteSettingsCreationAttributes extends Optional<SiteSettingsAttributes, 'id' | 'value'> { }

class SiteSettings extends Model<SiteSettingsAttributes, SiteSettingsCreationAttributes> implements SiteSettingsAttributes {
    declare id: string
    declare key: string
    declare value: string | null
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

SiteSettings.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        key: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'site_settings',
        modelName: 'SiteSettings',
    }
)

export { SiteSettings, SiteSettingsAttributes, SiteSettingsCreationAttributes }
