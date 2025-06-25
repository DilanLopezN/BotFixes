import { DatePlugin } from './../../../common/mongoosePlugins/date.plugin';
import { Team } from './../interfaces/team.interface';
import { AfterFindSoftDeletePlugin } from '../../../common/mongoosePlugins/afterFindSoftDelete.plugin';
import * as mongoose from 'mongoose';

export const AttendancePeriod = new mongoose.Schema(
    {
        start: Number,
        end: Number,
    },
    { versionKey: false, _id: false },
);

export const AttendancePeriods = new mongoose.Schema(
    {
        mon: [AttendancePeriod],
        tue: [AttendancePeriod],
        wed: [AttendancePeriod],
        thu: [AttendancePeriod],
        fri: [AttendancePeriod],
        sat: [AttendancePeriod],
        sun: [AttendancePeriod],
    },
    { versionKey: false, _id: false },
);

const TeamPermissionSchema = new mongoose.Schema(
    {
        canStartConversation: Boolean,
        canViewFinishedConversations: Boolean,
        canViewOpenTeamConversations: Boolean,
        canViewConversationContent: Boolean,
        canTransferConversations: Boolean,
        canSendAudioMessage: { type: Boolean, default: true },
        canSendOfficialTemplate: { type: Boolean, default: true, required: false },
        canViewHistoricConversation: { type: Boolean, default: false, required: false },
        canSendMultipleMessages: { type: Boolean, default: false, required: false },
    },
    { _id: false },
);

const TeamUserSchema = new mongoose.Schema(
    {
        userId: mongoose.Types.ObjectId,
        isSupervisor: Boolean,
        permission: TeamPermissionSchema,
    },
    { _id: false, strictQuery: true },
);

export const OffDaysPeriodSchema = new mongoose.Schema(
    {
        start: Number,
        end: Number,
        name: String,
        message: String,
        cannotAssignEndConversation: { type: Boolean, required: false },
    },
    { versionKey: false, _id: false },
);

export const TeamSchema = new mongoose.Schema(
    {
        name: String,
        workspaceId: mongoose.Types.ObjectId,
        roleUsers: [TeamUserSchema],
        priority: Number,
        color: { type: String, default: '#0b63af' },
        attendancePeriods: AttendancePeriods,
        assignMessage: { type: String, required: false },
        cannotAssignMessage: { type: String, required: false },
        cannotAssignEndConversation: { type: Boolean, required: false },
        notificationNewAttendance: { type: Boolean, required: false },
        offDays: [OffDaysPeriodSchema],
        reassignConversationInterval: { type: Number, required: false },
        viewPublicDashboard: { type: Boolean, required: false, default: true },
        canReceiveTransfer: { type: Boolean, required: false, default: true },
        inactivatedAt: { type: Date, required: false },
        deletedAt: { type: Date, required: false },
        requiredConversationCategorization: { type: Boolean, required: false },
    },
    { versionKey: false, collection: 'teams', strictQuery: true },
);

TeamSchema.plugin(DatePlugin);
TeamSchema.plugin(AfterFindSoftDeletePlugin);

export const TeamModel: mongoose.Model<Team> = mongoose.model<Team>('Teams', TeamSchema, 'teams');
