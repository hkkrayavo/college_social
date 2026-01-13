import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface EventGroupAttributes {
    id: string
    eventId: string
    groupId: string
}

interface EventGroupCreationAttributes extends Optional<EventGroupAttributes, 'id'> { }

class EventGroup extends Model<EventGroupAttributes, EventGroupCreationAttributes> implements EventGroupAttributes {
    declare id: string
    declare eventId: string
    declare groupId: string
}

EventGroup.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        eventId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'event_id',
            references: {
                model: 'events',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'group_id',
            references: {
                model: 'groups',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        tableName: 'event_groups',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['event_id', 'group_id'],
            },
        ],
    }
)

export default EventGroup
