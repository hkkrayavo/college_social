import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface AlbumGroupAttributes {
    id: string
    albumId: string
    groupId: string
}

interface AlbumGroupCreationAttributes extends Optional<AlbumGroupAttributes, 'id'> { }

class AlbumGroup extends Model<AlbumGroupAttributes, AlbumGroupCreationAttributes> implements AlbumGroupAttributes {
    declare id: string
    declare albumId: string
    declare groupId: string
}

AlbumGroup.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        albumId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'albums',
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
    },
    {
        sequelize,
        tableName: 'album_groups',
        modelName: 'AlbumGroup',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['album_id', 'group_id'],
            },
        ],
    }
)

export { AlbumGroup, AlbumGroupAttributes }
