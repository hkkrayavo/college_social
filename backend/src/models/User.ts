import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

export type UserStatus = 'pending' | 'approved' | 'rejected'

interface UserAttributes {
    id: string
    name: string
    mobileNumber: string
    email: string | null
    profilePictureUrl: string | null
    status: UserStatus
    createdByAdmin: boolean
    firstLoginComplete: boolean
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date | null
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'email' | 'profilePictureUrl' | 'status' | 'createdByAdmin' | 'firstLoginComplete' | 'deletedAt'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare id: string
    declare name: string
    declare mobileNumber: string
    declare email: string | null
    declare profilePictureUrl: string | null
    declare status: UserStatus
    declare createdByAdmin: boolean
    declare firstLoginComplete: boolean
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
    declare deletedAt: Date | null
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        mobileNumber: {
            type: DataTypes.STRING(15),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        profilePictureUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending',
        },
        createdByAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        firstLoginComplete: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'users',
        modelName: 'User',
        paranoid: true, // Soft delete
    }
)

export { User, UserAttributes, UserCreationAttributes }
