import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface PostGroupAttributes {
    id: string
    postId: string
    groupId: string
}

interface PostGroupCreationAttributes extends Optional<PostGroupAttributes, 'id'> { }

class PostGroup extends Model<PostGroupAttributes, PostGroupCreationAttributes> implements PostGroupAttributes {
    declare id: string
    declare postId: string
    declare groupId: string
}

PostGroup.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        postId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'posts',
                key: 'id',
            },
            onDelete: 'CASCADE',
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
        tableName: 'post_groups',
        modelName: 'PostGroup',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['post_id', 'group_id'],
            },
        ],
    }
)

export { PostGroup, PostGroupAttributes }
