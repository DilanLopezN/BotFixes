import * as mongoose from 'mongoose';
import { User, UserRoles, PermissionResources } from '../interfaces/user.interface';
import * as crypto from 'crypto-js';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import { TimesmapPlugin } from '../../../common/mongoosePlugins/timestamp.plugin';
import { LoginMethod } from 'kissbot-core';
import { UserLanguage } from '../dtos/user.dto';
export { LoginMethod };
export const RoleSchema = new mongoose.Schema(
    {
        resource: {
            type: String,
            enum: [...Object.values(PermissionResources)],
        },
        resourceId: mongoose.Schema.Types.ObjectId,
        role: {
            type: String,
            enum: [...Object.values(UserRoles)],
        },
    },
    { versionKey: false },
);

export const LiveAgentParamsSchema = new mongoose.Schema(
    {
        notifications: {
            emitSoundNotifications: Boolean,
            notificationNewAttendance: { type: Boolean, default: true },
        },
    },
    { versionKey: false, _id: false },
);

export const UserSchema = new mongoose.Schema(
    {
        name: String,
        email: String,
        password: String,
        timezone: { type: String, required: false },
        avatar: String,
        loginMethod: { type: String, required: false, enum: [...Object.values(LoginMethod)], default: LoginMethod.bot },
        cognitoUniqueId: String,
        roles: [RoleSchema],
        language: {
            type: String,
            enum: [...Object.values(UserLanguage)],
            default: UserLanguage.en,
        },
        liveAgentParams: LiveAgentParamsSchema,
        passwordExpires: Number,
        erpUsername: { type: String, required: false },
        isVerified: { type: Boolean, default: false },
    },
    { versionKey: false, strictQuery: true },
);

UserSchema.pre<User>('save', function (next) {
    const user = this;
    if (!!user.password) {
        user.password = crypto.SHA256(user.password).toString();
    }
    next();
});

UserSchema.plugin(AfterFindSoftDeletePlugin);
UserSchema.plugin(TimesmapPlugin);

export const UserModel: mongoose.Model<User> = mongoose.model<User>('User', UserSchema);
