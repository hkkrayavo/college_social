import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database.js'

interface OtpVerificationAttributes {
    id: number
    mobileNumber: string
    otp: string
    attempts: number
    expiresAt: Date
    createdAt?: Date
}

interface OtpCreationAttributes extends Optional<OtpVerificationAttributes, 'id' | 'attempts'> { }

class OtpVerification extends Model<OtpVerificationAttributes, OtpCreationAttributes> implements OtpVerificationAttributes {
    declare id: number
    declare mobileNumber: string
    declare otp: string
    declare attempts: number
    declare expiresAt: Date
    declare readonly createdAt: Date
}

OtpVerification.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        mobileNumber: {
            type: DataTypes.STRING(15),
            allowNull: false,
        },
        otp: {
            type: DataTypes.STRING(6),
            allowNull: false,
        },
        attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'otp_verifications',
        modelName: 'OtpVerification',
        updatedAt: false,
        indexes: [
            {
                fields: ['mobile_number', 'expires_at'],
            },
        ],
    }
)

export { OtpVerification, OtpVerificationAttributes }
