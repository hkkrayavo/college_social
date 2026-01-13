import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface EventAttributes {
    id: string
    name: string
    date: Date
    endDate: Date | null
    startTime: string | null
    endTime: string | null
    description: string | null
    createdBy: string
    createdAt?: Date
    updatedAt?: Date
}

interface EventCreationAttributes extends Optional<EventAttributes, 'id' | 'endDate' | 'startTime' | 'endTime' | 'description'> { }

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
    declare id: string
    declare name: string
    declare date: Date
    declare endDate: Date | null
    declare startTime: string | null
    declare endTime: string | null
    declare description: string | null
    declare createdBy: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
}

Event.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        startTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        endTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        tableName: 'events',
        modelName: 'Event',
    }
)

export { Event, EventAttributes, EventCreationAttributes }
